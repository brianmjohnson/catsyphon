"""
RawLog repository.
"""

import uuid
from pathlib import Path
from typing import List, Optional

from sqlalchemy.orm import Session

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import RawLog


class RawLogRepository(BaseRepository[RawLog]):
    """Repository for RawLog model."""

    def __init__(self, session: Session):
        super().__init__(RawLog, session)

    def get_by_conversation(self, conversation_id: uuid.UUID) -> List[RawLog]:
        """
        Get raw logs for a conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            List of raw log instances
        """
        return (
            self.session.query(RawLog)
            .filter(RawLog.conversation_id == conversation_id)
            .order_by(RawLog.imported_at.desc())
            .all()
        )

    def get_by_agent_type(
        self,
        agent_type: str,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[RawLog]:
        """
        Get raw logs by agent type.

        Args:
            agent_type: Agent type (e.g., 'claude-code')
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of raw log instances
        """
        query = (
            self.session.query(RawLog)
            .filter(RawLog.agent_type == agent_type)
            .order_by(RawLog.imported_at.desc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def create_from_file(
        self,
        conversation_id: uuid.UUID,
        agent_type: str,
        log_format: str,
        file_path: Path,
        **kwargs,
    ) -> RawLog:
        """
        Create raw log entry from file.

        Args:
            conversation_id: Conversation UUID
            agent_type: Agent type (e.g., 'claude-code')
            log_format: Log format (e.g., 'jsonl')
            file_path: Path to original log file
            **kwargs: Additional fields (e.g., extra_data)

        Returns:
            Created raw log instance
        """
        # Read file content
        raw_content = file_path.read_text(encoding="utf-8")

        return self.create(
            conversation_id=conversation_id,
            agent_type=agent_type,
            log_format=log_format,
            raw_content=raw_content,
            file_path=str(file_path),
            **kwargs,
        )

    def create_from_content(
        self,
        conversation_id: uuid.UUID,
        agent_type: str,
        log_format: str,
        raw_content: str,
        file_path: Optional[str] = None,
        **kwargs,
    ) -> RawLog:
        """
        Create raw log entry from content string.

        Args:
            conversation_id: Conversation UUID
            agent_type: Agent type (e.g., 'claude-code')
            log_format: Log format (e.g., 'jsonl')
            raw_content: Raw log content
            file_path: Optional file path
            **kwargs: Additional fields (e.g., extra_data)

        Returns:
            Created raw log instance
        """
        return self.create(
            conversation_id=conversation_id,
            agent_type=agent_type,
            log_format=log_format,
            raw_content=raw_content,
            file_path=file_path,
            **kwargs,
        )
