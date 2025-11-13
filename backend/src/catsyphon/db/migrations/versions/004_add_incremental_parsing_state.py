"""add incremental parsing state to raw_logs

Revision ID: 004_incremental_state
Revises: 003_conversation_counts
Create Date: 2025-11-13 01:25:00.000000

This migration adds columns to track incremental parsing state for Phase 2
optimization, enabling append-only updates without full reparse.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_incremental_state"
down_revision: Union[str, None] = "003_conversation_counts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add incremental parsing state tracking columns."""
    # Add state tracking columns with defaults
    op.add_column(
        "raw_logs",
        sa.Column(
            "last_processed_offset",
            sa.Integer(),
            server_default="0",
            nullable=False,
            comment="Byte offset in file where we last stopped parsing",
        ),
    )
    op.add_column(
        "raw_logs",
        sa.Column(
            "last_processed_line",
            sa.Integer(),
            server_default="0",
            nullable=False,
            comment="Line number for debugging/human readability",
        ),
    )
    op.add_column(
        "raw_logs",
        sa.Column(
            "file_size_bytes",
            sa.Integer(),
            server_default="0",
            nullable=False,
            comment="File size at last parse (detect truncation)",
        ),
    )
    op.add_column(
        "raw_logs",
        sa.Column(
            "partial_hash",
            sa.String(length=64),
            nullable=True,
            comment="Hash of content up to last_processed_offset",
        ),
    )
    op.add_column(
        "raw_logs",
        sa.Column(
            "last_message_timestamp",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Timestamp of last processed message (validation)",
        ),
    )


def downgrade() -> None:
    """Remove incremental parsing state tracking columns."""
    op.drop_column("raw_logs", "last_message_timestamp")
    op.drop_column("raw_logs", "partial_hash")
    op.drop_column("raw_logs", "file_size_bytes")
    op.drop_column("raw_logs", "last_processed_line")
    op.drop_column("raw_logs", "last_processed_offset")
