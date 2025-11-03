"""
Epoch repository.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import Epoch


class EpochRepository(BaseRepository[Epoch]):
    """Repository for Epoch model."""

    def __init__(self, session: Session):
        super().__init__(Epoch, session)

    def get_by_conversation(
        self,
        conversation_id: uuid.UUID,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Epoch]:
        """
        Get epochs for a conversation.

        Args:
            conversation_id: Conversation UUID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of epochs ordered by sequence
        """
        query = (
            self.session.query(Epoch)
            .filter(Epoch.conversation_id == conversation_id)
            .order_by(Epoch.sequence.asc())
            .offset(offset)
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_sequence(
        self, conversation_id: uuid.UUID, sequence: int
    ) -> Optional[Epoch]:
        """
        Get epoch by conversation and sequence number.

        Args:
            conversation_id: Conversation UUID
            sequence: Epoch sequence number

        Returns:
            Epoch instance or None
        """
        return (
            self.session.query(Epoch)
            .filter(
                Epoch.conversation_id == conversation_id,
                Epoch.sequence == sequence,
            )
            .first()
        )

    def create_epoch(
        self,
        conversation_id: uuid.UUID,
        sequence: int,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        intent: Optional[str] = None,
        outcome: Optional[str] = None,
        sentiment: Optional[str] = None,
        sentiment_score: Optional[float] = None,
        **kwargs,
    ) -> Epoch:
        """
        Create a new epoch.

        Args:
            conversation_id: Conversation UUID
            sequence: Epoch sequence number
            start_time: Epoch start time
            end_time: Epoch end time (optional)
            intent: Intent classification (optional)
            outcome: Outcome classification (optional)
            sentiment: Sentiment classification (optional)
            sentiment_score: Sentiment score (optional)
            **kwargs: Additional fields (e.g., extra_data)

        Returns:
            Created epoch instance
        """
        # Calculate duration if both times provided
        duration_seconds = None
        if end_time and start_time:
            duration_seconds = int((end_time - start_time).total_seconds())

        return self.create(
            conversation_id=conversation_id,
            sequence=sequence,
            start_time=start_time,
            end_time=end_time,
            intent=intent,
            outcome=outcome,
            sentiment=sentiment,
            sentiment_score=sentiment_score,
            duration_seconds=duration_seconds,
            **kwargs,
        )

    def get_next_sequence(self, conversation_id: uuid.UUID) -> int:
        """
        Get next sequence number for a conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Next available sequence number (0-based)
        """
        max_seq = (
            self.session.query(Epoch.sequence)
            .filter(Epoch.conversation_id == conversation_id)
            .order_by(Epoch.sequence.desc())
            .first()
        )
        return (max_seq[0] + 1) if max_seq else 0
