"""add denormalized count columns to conversations

Revision ID: 003_conversation_counts
Revises: 002_file_hash
Create Date: 2025-11-13 00:07:32.943020

This migration adds denormalized count columns to the conversations table
to avoid expensive Cartesian product joins when listing conversations.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_conversation_counts"
down_revision: Union[str, None] = "002_file_hash"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add count columns and backfill existing data."""
    # Add count columns with default value of 0
    op.add_column(
        "conversations",
        sa.Column("message_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "conversations",
        sa.Column("epoch_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "conversations",
        sa.Column("files_count", sa.Integer(), server_default="0", nullable=False),
    )

    # Backfill counts for existing conversations
    # This uses correlated subqueries to compute counts efficiently
    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            UPDATE conversations
            SET
                message_count = (
                    SELECT COUNT(*)
                    FROM messages
                    WHERE messages.conversation_id = conversations.id
                ),
                epoch_count = (
                    SELECT COUNT(*)
                    FROM epochs
                    WHERE epochs.conversation_id = conversations.id
                ),
                files_count = (
                    SELECT COUNT(*)
                    FROM files_touched
                    WHERE files_touched.conversation_id = conversations.id
                )
            """
        )
    )


def downgrade() -> None:
    """Remove count columns."""
    op.drop_column("conversations", "files_count")
    op.drop_column("conversations", "epoch_count")
    op.drop_column("conversations", "message_count")
