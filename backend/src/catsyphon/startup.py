"""
Startup dependency checks for CatSyphon backend.

Validates critical dependencies before the application starts serving requests.
Fails fast with clear, actionable error messages when requirements aren't met.
"""

import sys
from typing import Optional

from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import text

from catsyphon.config import settings
from catsyphon.db.connection import SessionLocal, engine


class StartupCheckError(Exception):
    """Raised when a critical startup check fails."""

    def __init__(self, message: str, hint: Optional[str] = None):
        self.message = message
        self.hint = hint
        super().__init__(message)

    def __str__(self) -> str:
        error_msg = f"\n{'='*70}\n❌ STARTUP CHECK FAILED\n{'='*70}\n\n{self.message}\n"
        if self.hint:
            error_msg += f"\n💡 Hint: {self.hint}\n"
        error_msg += f"{'='*70}\n"
        return error_msg


def check_database_connection() -> None:
    """
    Verify PostgreSQL database is accessible and responsive.

    Raises:
        StartupCheckError: If database connection fails
    """
    try:
        # Attempt to create a connection and execute a simple query
        with SessionLocal() as session:
            result = session.execute(text("SELECT 1")).scalar()
            if result != 1:
                raise StartupCheckError(
                    "Database query returned unexpected result",
                    "Database may be corrupted or misconfigured",
                )
    except StartupCheckError:
        raise
    except Exception as e:
        # Determine specific error type for helpful messages
        error_str = str(e).lower()

        if "could not connect" in error_str or "connection refused" in error_str:
            hint = (
                "PostgreSQL is not running.\n"
                "  - Start with Docker: docker-compose up -d\n"
                "  - Or check Colima status: colima status"
            )
        elif "authentication failed" in error_str or "password" in error_str:
            hint = (
                "Database authentication failed.\n"
                "  - Check credentials in .env file\n"
                f"  - Current user: {settings.postgres_user}\n"
                f"  - Current database: {settings.postgres_db}"
            )
        elif "database" in error_str and "does not exist" in error_str:
            hint = (
                f"Database '{settings.postgres_db}' does not exist.\n"
                "  - Create it: createdb {settings.postgres_db}\n"
                "  - Or run migrations: alembic upgrade head"
            )
        elif "timeout" in error_str or "timed out" in error_str:
            hint = (
                "Database connection timed out.\n"
                "  - Check if PostgreSQL is running\n"
                "  - Verify network connectivity\n"
                f"  - Current host: {settings.postgres_host}:{settings.postgres_port}"
            )
        else:
            hint = f"Check your database configuration in .env\nError: {str(e)}"

        raise StartupCheckError(
            f"Cannot connect to PostgreSQL database\n"
            f"Host: {settings.postgres_host}:{settings.postgres_port}\n"
            f"Database: {settings.postgres_db}\n"
            f"User: {settings.postgres_user}",
            hint,
        ) from e


def check_database_migrations() -> None:
    """
    Verify Alembic database migrations are current.

    Raises:
        StartupCheckError: If pending migrations exist
    """
    try:
        # Get Alembic configuration
        alembic_cfg = AlembicConfig("alembic.ini")
        script = ScriptDirectory.from_config(alembic_cfg)

        # Get current head revision from migration scripts
        head_revision = script.get_current_head()

        # Get current revision from database
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_revision = context.get_current_revision()

        if current_revision is None:
            raise StartupCheckError(
                "Database has no migration version\n"
                "Database appears uninitialized",
                "Run migrations: alembic upgrade head",
            )

        if current_revision != head_revision:
            # Get list of pending migrations
            pending = []
            for rev in script.iterate_revisions(head_revision, current_revision):
                if rev.revision != current_revision:
                    pending.append(f"  - {rev.revision[:8]}: {rev.doc}")

            pending_list = "\n".join(pending) if pending else "Unknown"

            raise StartupCheckError(
                f"Database migrations are out of date\n"
                f"Current revision: {current_revision[:8] if current_revision else 'None'}\n"
                f"Expected revision: {head_revision[:8] if head_revision else 'None'}\n"
                f"\nPending migrations:\n{pending_list}",
                "Run: alembic upgrade head",
            )

    except StartupCheckError:
        raise
    except FileNotFoundError:
        raise StartupCheckError(
            "Alembic configuration not found",
            "Ensure alembic.ini exists in the project root",
        )
    except Exception as e:
        raise StartupCheckError(
            f"Failed to check migration status: {str(e)}",
            "Verify Alembic is properly configured",
        ) from e


def check_required_environment() -> None:
    """
    Validate required environment variables are set.

    Raises:
        StartupCheckError: If critical environment variables are missing
    """
    missing = []
    warnings = []

    # Check critical database settings
    if not settings.postgres_host:
        missing.append("POSTGRES_HOST")
    if not settings.postgres_db:
        missing.append("POSTGRES_DB")
    if not settings.postgres_user:
        missing.append("POSTGRES_USER")
    if not settings.postgres_password:
        missing.append("POSTGRES_PASSWORD")

    # Check optional but recommended settings
    if not settings.openai_api_key or settings.openai_api_key == "your_openai_api_key_here":
        warnings.append(
            "OPENAI_API_KEY not set (tagging features will not work)"
        )

    if missing:
        raise StartupCheckError(
            f"Missing required environment variables:\n" +
            "\n".join(f"  - {var}" for var in missing),
            "Set these variables in your .env file",
        )

    # Log warnings but don't fail
    if warnings:
        print("\n⚠️  Configuration Warnings:")
        for warning in warnings:
            print(f"  - {warning}")
        print()


def run_all_startup_checks() -> None:
    """
    Execute all startup dependency checks.

    Runs checks in order of dependency:
    1. Environment variables
    2. Database connection
    3. Database migrations

    Raises:
        StartupCheckError: If any critical check fails
        SystemExit: After logging the error
    """
    checks = [
        ("Environment Variables", check_required_environment),
        ("Database Connection", check_database_connection),
        ("Database Migrations", check_database_migrations),
    ]

    print("\n" + "="*70)
    print("🚀 Starting CatSyphon Backend - Running Startup Checks")
    print("="*70 + "\n")

    for check_name, check_func in checks:
        try:
            print(f"  Checking {check_name}...", end=" ")
            check_func()
            print("✅ PASS")
        except StartupCheckError as e:
            print("❌ FAIL")
            print(str(e))
            sys.exit(1)

    print("\n" + "="*70)
    print("✅ All startup checks passed - Server is ready")
    print("="*70 + "\n")
