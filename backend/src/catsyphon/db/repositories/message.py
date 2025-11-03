"""
Message repository.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import Message


class MessageRepository(BaseRepository[Message]):
    """Repository for Message model."""

    def __init__(self, session: Session):
        super().__init__(Message, session)

    def get_by_conversation(
        self,
        conversation_id: uuid.UUID,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Message]:
        """
        Get messages for a conversation.

        Args:
            conversation_id: Conversation UUID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of messages ordered by sequence
        """
        query = (
            self.session.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.sequence.asc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_epoch(
        self,
        epoch_id: uuid.UUID,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Message]:
        """
        Get messages for an epoch.

        Args:
            epoch_id: Epoch UUID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of messages ordered by sequence
        """
        query = (
            self.session.query(Message)
            .filter(Message.epoch_id == epoch_id)
            .order_by(Message.sequence.asc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_role(
        self,
        conversation_id: uuid.UUID,
        role: str,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Message]:
        """
        Get messages by role (user/assistant/system).

        Args:
            conversation_id: Conversation UUID
            role: Message role
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of messages
        """
        query = (
            self.session.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.role == role,
            )
            .order_by(Message.sequence.asc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def create_message(
        self,
        epoch_id: uuid.UUID,
        conversation_id: uuid.UUID,
        role: str,
        content: str,
        timestamp: datetime,
        sequence: int,
        tool_calls: Optional[list] = None,
        tool_results: Optional[list] = None,
        code_changes: Optional[list] = None,
        entities: Optional[dict] = None,
        **kwargs,
    ) -> Message:
        """
        Create a new message.

        Args:
            epoch_id: Epoch UUID
            conversation_id: Conversation UUID
            role: Message role ('user', 'assistant', 'system')
            content: Message content
            timestamp: Message timestamp
            sequence: Message sequence in epoch
            tool_calls: List of tool calls (optional)
            tool_results: List of tool results (optional)
            code_changes: List of code changes (optional)
            entities: Extracted entities dict (optional)
            **kwargs: Additional fields (e.g., extra_data)

        Returns:
            Created message instance
        """
        return self.create(
            epoch_id=epoch_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            timestamp=timestamp,
            sequence=sequence,
            tool_calls=tool_calls or [],
            tool_results=tool_results or [],
            code_changes=code_changes or [],
            entities=entities or {},
            **kwargs,
        )

    def bulk_create(self, messages: List[dict]) -> List[Message]:
        """
        Bulk create messages for efficiency.

        Args:
            messages: List of message dictionaries with all required fields

        Returns:
            List of created message instances

        Example:
            messages = [
                {
                    "epoch_id": epoch_id,
                    "conversation_id": conversation_id,
                    "role": "user",
                    "content": "Hello",
                    "timestamp": datetime.now(),
                    "sequence": 0,
                },
                ...
            ]
            created = repo.bulk_create(messages)
        """
        # Create Message instances
        instances = [Message(**msg_data) for msg_data in messages]

        # Bulk insert
        self.session.bulk_save_objects(instances, return_defaults=True)
        self.session.flush()

        return instances
