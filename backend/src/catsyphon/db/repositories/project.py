"""
Project repository.
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import Project


class ProjectRepository(BaseRepository[Project]):
    """Repository for Project model."""

    def __init__(self, session: Session):
        super().__init__(Project, session)

    def get_by_name(self, name: str) -> Optional[Project]:
        """
        Get project by name.

        Args:
            name: Project name

        Returns:
            Project instance or None
        """
        return self.session.query(Project).filter(Project.name == name).first()

    def search_by_name(self, name_pattern: str) -> List[Project]:
        """
        Search projects by name pattern.

        Args:
            name_pattern: SQL LIKE pattern (e.g., "%search%")

        Returns:
            List of matching projects
        """
        return (
            self.session.query(Project).filter(Project.name.ilike(name_pattern)).all()
        )

    def get_or_create_by_name(self, name: str, **kwargs) -> Project:
        """
        Get existing project or create new one.

        Args:
            name: Project name
            **kwargs: Additional project fields (e.g., description)

        Returns:
            Project instance
        """
        project = self.get_by_name(name)
        if not project:
            project = self.create(name=name, **kwargs)
        return project
