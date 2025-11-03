"""Initial database schema

Revision ID: 001_initial
Revises:
Create Date: 2025-11-01 17:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create projects table
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # Create developers table
    op.create_table(
        "developers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # Create conversations table
    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("developer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("agent_type", sa.String(50), nullable=False),
        sa.Column("agent_version", sa.String(50), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="open"),
        sa.Column("success", sa.Boolean(), nullable=True),
        sa.Column("iteration_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
        ),
        sa.ForeignKeyConstraint(
            ["developer_id"],
            ["developers.id"],
        ),
    )

    # Create epochs table
    op.create_table(
        "epochs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("intent", sa.String(100), nullable=True),
        sa.Column("outcome", sa.String(100), nullable=True),
        sa.Column("sentiment", sa.String(50), nullable=True),
        sa.Column("sentiment_score", sa.Float(), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("conversation_id", "sequence"),
    )

    # Create messages table
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "epoch_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column(
            "tool_calls",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "tool_results",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "code_changes",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "entities",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["epoch_id"],
            ["epochs.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("epoch_id", "sequence"),
    )

    # Create files_touched table
    op.create_table(
        "files_touched",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "epoch_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "message_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column("file_path", sa.Text(), nullable=False),
        sa.Column("change_type", sa.String(50), nullable=True),
        sa.Column("lines_added", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lines_deleted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lines_modified", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["epoch_id"],
            ["epochs.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["messages.id"],
            ondelete="CASCADE",
        ),
    )

    # Create conversation_tags table
    op.create_table(
        "conversation_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("tag_type", sa.String(100), nullable=False),
        sa.Column("tag_value", sa.String(255), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("conversation_id", "tag_type", "tag_value"),
    )

    # Create raw_logs table
    op.create_table(
        "raw_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("agent_type", sa.String(50), nullable=False),
        sa.Column("log_format", sa.String(50), nullable=False),
        sa.Column("raw_content", sa.Text(), nullable=False),
        sa.Column("file_path", sa.Text(), nullable=True),
        sa.Column(
            "imported_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
    )

    # Create indexes
    # Conversation indexes
    op.create_index("idx_conversations_project", "conversations", ["project_id"])
    op.create_index("idx_conversations_developer", "conversations", ["developer_id"])
    op.create_index("idx_conversations_agent", "conversations", ["agent_type"])
    op.create_index("idx_conversations_time", "conversations", ["start_time"])
    op.create_index("idx_conversations_status", "conversations", ["status"])
    op.create_index(
        "idx_conversations_tags",
        "conversations",
        ["tags"],
        postgresql_using="gin",
    )

    # Epoch indexes
    op.create_index("idx_epochs_conversation", "epochs", ["conversation_id"])
    op.create_index("idx_epochs_intent", "epochs", ["intent"])
    op.create_index("idx_epochs_sentiment", "epochs", ["sentiment"])
    op.create_index("idx_epochs_time", "epochs", ["start_time"])

    # Message indexes
    op.create_index("idx_messages_epoch", "messages", ["epoch_id"])
    op.create_index("idx_messages_conversation", "messages", ["conversation_id"])
    op.create_index("idx_messages_timestamp", "messages", ["timestamp"])
    op.create_index(
        "idx_messages_entities", "messages", ["entities"], postgresql_using="gin"
    )

    # Files touched indexes
    op.create_index("idx_files_conversation", "files_touched", ["conversation_id"])
    op.create_index("idx_files_epoch", "files_touched", ["epoch_id"])
    op.create_index("idx_files_path", "files_touched", ["file_path"])

    # Tag indexes
    op.create_index("idx_tags_conversation", "conversation_tags", ["conversation_id"])
    op.create_index("idx_tags_type", "conversation_tags", ["tag_type"])
    op.create_index("idx_tags_value", "conversation_tags", ["tag_value"])

    # Full-text search index on messages
    op.execute(
        "CREATE INDEX idx_messages_content_fts ON messages "
        "USING GIN (to_tsvector('english', content))"
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_messages_content_fts", table_name="messages")
    op.drop_index("idx_tags_value", table_name="conversation_tags")
    op.drop_index("idx_tags_type", table_name="conversation_tags")
    op.drop_index("idx_tags_conversation", table_name="conversation_tags")
    op.drop_index("idx_files_path", table_name="files_touched")
    op.drop_index("idx_files_epoch", table_name="files_touched")
    op.drop_index("idx_files_conversation", table_name="files_touched")
    op.drop_index("idx_messages_entities", table_name="messages")
    op.drop_index("idx_messages_timestamp", table_name="messages")
    op.drop_index("idx_messages_conversation", table_name="messages")
    op.drop_index("idx_messages_epoch", table_name="messages")
    op.drop_index("idx_epochs_time", table_name="epochs")
    op.drop_index("idx_epochs_sentiment", table_name="epochs")
    op.drop_index("idx_epochs_intent", table_name="epochs")
    op.drop_index("idx_epochs_conversation", table_name="epochs")
    op.drop_index("idx_conversations_tags", table_name="conversations")
    op.drop_index("idx_conversations_status", table_name="conversations")
    op.drop_index("idx_conversations_time", table_name="conversations")
    op.drop_index("idx_conversations_agent", table_name="conversations")
    op.drop_index("idx_conversations_developer", table_name="conversations")
    op.drop_index("idx_conversations_project", table_name="conversations")

    # Drop tables in reverse order
    op.drop_table("raw_logs")
    op.drop_table("conversation_tags")
    op.drop_table("files_touched")
    op.drop_table("messages")
    op.drop_table("epochs")
    op.drop_table("conversations")
    op.drop_table("developers")
    op.drop_table("projects")
