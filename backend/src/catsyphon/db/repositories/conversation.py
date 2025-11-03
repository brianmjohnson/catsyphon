"""
Conversation repository.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import Conversation


class ConversationRepository(BaseRepository[Conversation]):
    """Repository for Conversation model."""

    def __init__(self, session: Session):
        super().__init__(Conversation, session)

    def get_with_relations(self, id: uuid.UUID) -> Optional[Conversation]:
        """
        Get conversation with all related data loaded.

        Args:
            id: Conversation UUID

        Returns:
            Conversation with relations or None
        """
        return (
            self.session.query(Conversation)
            .options(
                joinedload(Conversation.project),
                joinedload(Conversation.developer),
                joinedload(Conversation.epochs),
                joinedload(Conversation.messages),
            )
            .filter(Conversation.id == id)
            .first()
        )

    def get_by_project(
        self,
        project_id: uuid.UUID,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Conversation]:
        """
        Get conversations by project.

        Args:
            project_id: Project UUID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of conversations
        """
        query = (
            self.session.query(Conversation)
            .filter(Conversation.project_id == project_id)
            .order_by(Conversation.start_time.desc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_developer(
        self,
        developer_id: uuid.UUID,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Conversation]:
        """
        Get conversations by developer.

        Args:
            developer_id: Developer UUID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of conversations
        """
        query = (
            self.session.query(Conversation)
            .filter(Conversation.developer_id == developer_id)
            .order_by(Conversation.start_time.desc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_agent_type(
        self,
        agent_type: str,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Conversation]:
        """
        Get conversations by agent type.

        Args:
            agent_type: Agent type (e.g., 'claude-code')
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of conversations
        """
        query = (
            self.session.query(Conversation)
            .filter(Conversation.agent_type == agent_type)
            .order_by(Conversation.start_time.desc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Conversation]:
        """
        Get conversations within date range.

        Args:
            start_date: Start datetime
            end_date: End datetime
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of conversations
        """
        query = (
            self.session.query(Conversation)
            .filter(
                Conversation.start_time >= start_date,
                Conversation.start_time <= end_date,
            )
            .order_by(Conversation.start_time.desc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def count_by_status(self, status: str) -> int:
        """
        Count conversations by status.

        Args:
            status: Conversation status

        Returns:
            Count of conversations
        """
        return (
            self.session.query(Conversation)
            .filter(Conversation.status == status)
            .count()
        )

    def get_recent(self, limit: int = 10) -> List[Conversation]:
        """
        Get most recent conversations.

        Args:
            limit: Maximum number of results

        Returns:
            List of recent conversations
        """
        return (
            self.session.query(Conversation)
            .order_by(Conversation.start_time.desc())
            .limit(limit)
            .all()
        )
