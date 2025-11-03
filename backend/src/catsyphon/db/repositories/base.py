"""
Base repository class for common CRUD operations.
"""

import uuid
from typing import Generic, List, Optional, Type, TypeVar

from sqlalchemy.orm import Session

from catsyphon.models.db import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, model: Type[ModelType], session: Session):
        """
        Initialize repository.

        Args:
            model: SQLAlchemy model class
            session: Database session
        """
        self.model = model
        self.session = session

    def create(self, **kwargs) -> ModelType:
        """
        Create a new record.

        Args:
            **kwargs: Model field values

        Returns:
            Created model instance
        """
        instance = self.model(**kwargs)
        self.session.add(instance)
        self.session.flush()
        self.session.refresh(instance)
        return instance

    def get(self, id: uuid.UUID) -> Optional[ModelType]:
        """
        Get a record by ID.

        Args:
            id: Record UUID

        Returns:
            Model instance or None
        """
        return self.session.query(self.model).filter(self.model.id == id).first()

    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[ModelType]:
        """
        Get all records.

        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List of model instances
        """
        query = self.session.query(self.model).offset(offset)
        if limit:
            query = query.limit(limit)
        return query.all()

    def update(self, id: uuid.UUID, **kwargs) -> Optional[ModelType]:
        """
        Update a record.

        Args:
            id: Record UUID
            **kwargs: Fields to update

        Returns:
            Updated model instance or None
        """
        instance = self.get(id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            self.session.flush()
            self.session.refresh(instance)
        return instance

    def delete(self, id: uuid.UUID) -> bool:
        """
        Delete a record.

        Args:
            id: Record UUID

        Returns:
            True if deleted, False if not found
        """
        instance = self.get(id)
        if instance:
            self.session.delete(instance)
            self.session.flush()
            return True
        return False

    def count(self) -> int:
        """
        Count total records.

        Returns:
            Number of records
        """
        return self.session.query(self.model).count()
