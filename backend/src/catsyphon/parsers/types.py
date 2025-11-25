"""
Shared parser result types.

Provides structured metadata for downstream ingestion to improve
observability without changing the core ParsedConversation model.
"""

from dataclasses import dataclass, field
from typing import Any, List, Optional

from catsyphon.models.parsed import ParsedConversation


@dataclass
class ParseResult:
    """
    Structured parse output with metadata for observability.

    Attributes:
        conversation: ParsedConversation produced by the parser.
        parser_name: Identifier for the parser (e.g., "claude-code").
        parser_version: Version string from the parser metadata.
        parse_method: Parsing method used ("full", "incremental").
        change_type: Optional change detection result ("append", "rewrite", etc).
        metrics: Numeric or string metrics emitted by the parser.
        warnings: Human-readable parse warnings collected during detection/parse.
    """

    conversation: ParsedConversation
    parser_name: str
    parser_version: Optional[str]
    parse_method: str = "full"
    change_type: Optional[str] = None
    metrics: dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)


@dataclass
class ProbeResult:
    """
    Lightweight capability probe result for parser selection.

    Attributes:
        can_parse: Whether the parser believes it can parse the file.
        confidence: 0.0-1.0 confidence score for selection ordering.
        reasons: Human-readable hints for observability/debugging.
    """

    can_parse: bool
    confidence: float = 0.5
    reasons: List[str] = field(default_factory=list)
