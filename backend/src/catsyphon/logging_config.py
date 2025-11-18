"""
Centralized logging configuration for CatSyphon.

Provides setup_logging() function to configure logging for all entry points.
Supports separate handlers for stdout/stderr, file-based logging with rotation,
and configurable formats (standard or JSON).
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional

from catsyphon.config import settings


def setup_logging(
    context: str = "application",
    config_id: Optional[str] = None,
) -> logging.Logger:
    """
    Setup centralized logging configuration.

    Args:
        context: Logging context (application, api, watch, cli, llm, ingestion)
        config_id: Optional identifier for context-specific logs (e.g., watch daemon ID)

    Returns:
        Logger: Configured root logger

    Example:
        # API server
        setup_logging(context="api")

        # Watch daemon with specific config ID
        setup_logging(context="watch", config_id="abc-123")

        # CLI command
        setup_logging(context="cli")
    """
    # Get or create root logger
    root_logger = logging.getLogger()

    # Clear any existing handlers to avoid duplicates
    root_logger.handlers.clear()

    # Set log level from config
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    root_logger.setLevel(log_level)

    # Create formatters
    if settings.log_format == "json":
        # JSON format for production/log aggregation
        formatter = _get_json_formatter()
    else:
        # Standard human-readable format
        formatter = _get_standard_formatter()

    # Console handlers (stdout for INFO/DEBUG, stderr for WARNING+)
    if settings.log_console_enabled:
        if settings.log_to_stdout:
            stdout_handler = logging.StreamHandler(sys.stdout)
            stdout_handler.setLevel(logging.DEBUG)
            stdout_handler.setFormatter(formatter)
            # Only log INFO and DEBUG to stdout
            stdout_handler.addFilter(_MaxLevelFilter(logging.INFO))
            root_logger.addHandler(stdout_handler)

        if settings.log_to_stderr:
            stderr_handler = logging.StreamHandler(sys.stderr)
            stderr_handler.setLevel(logging.WARNING)
            stderr_handler.setFormatter(formatter)
            root_logger.addHandler(stderr_handler)

    # File handlers
    if settings.log_file_enabled:
        log_dir = settings.log_directory
        log_dir.mkdir(parents=True, exist_ok=True)

        # Application log (INFO and DEBUG)
        application_log = log_dir / _get_log_filename(context, config_id, "application")
        app_handler = _create_rotating_file_handler(application_log, formatter)
        app_handler.setLevel(logging.DEBUG)
        app_handler.addFilter(_MaxLevelFilter(logging.INFO))
        root_logger.addHandler(app_handler)

        # Error log (WARNING, ERROR, CRITICAL)
        error_log = log_dir / _get_log_filename(context, config_id, "error")
        error_handler = _create_rotating_file_handler(error_log, formatter)
        error_handler.setLevel(logging.WARNING)
        root_logger.addHandler(error_handler)

    # Log startup message
    root_logger.info(
        f"Logging initialized: context={context}, config_id={config_id}, "
        f"level={settings.log_level}, dir={settings.log_directory}"
    )

    return root_logger


def _get_log_filename(context: str, config_id: Optional[str], log_type: str) -> str:
    """
    Generate log filename based on context and type.

    Args:
        context: Logging context (api, watch, cli, etc.)
        config_id: Optional identifier for context-specific logs
        log_type: Type of log (application, error, llm)

    Returns:
        str: Log filename

    Examples:
        application, None, application -> application.log
        watch, abc-123, application -> watch-abc-123-application.log
        api, None, error -> api-error.log
    """
    if config_id:
        return f"{context}-{config_id}-{log_type}.log"
    elif context == "application":
        return f"{log_type}.log"
    else:
        return f"{context}-{log_type}.log"


def _create_rotating_file_handler(
    log_path: Path,
    formatter: logging.Formatter,
) -> logging.handlers.RotatingFileHandler:
    """
    Create a rotating file handler with configured limits.

    Args:
        log_path: Path to log file
        formatter: Log formatter to use

    Returns:
        RotatingFileHandler: Configured handler
    """
    handler = logging.handlers.RotatingFileHandler(
        log_path,
        maxBytes=settings.log_max_bytes,
        backupCount=settings.log_backup_count,
        encoding="utf-8",
    )
    handler.setFormatter(formatter)
    return handler


def _get_standard_formatter() -> logging.Formatter:
    """
    Get standard human-readable log formatter.

    Returns:
        Formatter: Standard log formatter
    """
    return logging.Formatter(
        fmt="[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def _get_json_formatter() -> logging.Formatter:
    """
    Get JSON log formatter for structured logging.

    Returns:
        Formatter: JSON log formatter
    """
    # Simple JSON-like formatter (for production, use python-json-logger)
    return logging.Formatter(
        fmt='{"time": "%(asctime)s", "name": "%(name)s", '
        '"level": "%(levelname)s", "message": "%(message)s"}',
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


class _MaxLevelFilter(logging.Filter):
    """
    Filter that only allows log records up to a maximum level.

    Used to send INFO/DEBUG to stdout and WARNING+ to stderr.
    """

    def __init__(self, max_level: int):
        super().__init__()
        self.max_level = max_level

    def filter(self, record: logging.LogRecord) -> bool:
        """Return True if record level is <= max_level."""
        return record.levelno <= self.max_level
