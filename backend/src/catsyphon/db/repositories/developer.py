"""
Developer repository.
"""

from typing import Optional

from sqlalchemy.orm import Session

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import Developer


class DeveloperRepository(BaseRepository[Developer]):
    """Repository for Developer model."""

    def __init__(self, session: Session):
        super().__init__(Developer, session)

    def get_by_username(self, username: str) -> Optional[Developer]:
        """
        Get developer by username.

        Args:
            username: Developer username

        Returns:
            Developer instance or None
        """
        return (
            self.session.query(Developer).filter(Developer.username == username).first()
        )

    def get_by_email(self, email: str) -> Optional[Developer]:
        """
        Get developer by email.

        Args:
            email: Developer email

        Returns:
            Developer instance or None
        """
        return self.session.query(Developer).filter(Developer.email == email).first()

    def get_or_create(self, username: str, **kwargs) -> Developer:
        """
        Get existing developer or create new one.

        Args:
            username: Developer username
            **kwargs: Additional developer fields

        Returns:
            Developer instance
        """
        developer = self.get_by_username(username)
        if not developer:
            developer = self.create(username=username, **kwargs)
        return developer
