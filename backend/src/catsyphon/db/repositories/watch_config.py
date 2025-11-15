"""
Watch configuration repository.
"""

import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from catsyphon.db.repositories.base import BaseRepository
from catsyphon.models.db import WatchConfiguration


class WatchConfigurationRepository(BaseRepository[WatchConfiguration]):
    """Repository for WatchConfiguration model."""

    def __init__(self, session: Session):
        super().__init__(WatchConfiguration, session)

    def get_by_directory(self, directory: str) -> Optional[WatchConfiguration]:
        """
        Get watch configuration by directory path.

        Args:
            directory: Directory path

        Returns:
            WatchConfiguration instance or None
        """
        return (
            self.session.query(WatchConfiguration)
            .filter(WatchConfiguration.directory == directory)
            .first()
        )

    def get_all_active(self) -> List[WatchConfiguration]:
        """
        Get all active watch configurations.

        Returns:
            List of active watch configurations
        """
        return (
            self.session.query(WatchConfiguration)
            .filter(WatchConfiguration.is_active == True)  # noqa: E712
            .all()
        )

    def get_all_inactive(self) -> List[WatchConfiguration]:
        """
        Get all inactive watch configurations.

        Returns:
            List of inactive watch configurations
        """
        return (
            self.session.query(WatchConfiguration)
            .filter(WatchConfiguration.is_active == False)  # noqa: E712
            .all()
        )

    def activate(self, id: uuid.UUID) -> Optional[WatchConfiguration]:
        """
        Activate a watch configuration.

        Args:
            id: Configuration UUID

        Returns:
            Updated configuration or None
        """
        from datetime import datetime

        return self.update(id, is_active=True, last_started_at=datetime.utcnow())

    def deactivate(self, id: uuid.UUID) -> Optional[WatchConfiguration]:
        """
        Deactivate a watch configuration.

        Args:
            id: Configuration UUID

        Returns:
            Updated configuration or None
        """
        from datetime import datetime

        return self.update(id, is_active=False, last_stopped_at=datetime.utcnow())

    def update_stats(
        self, id: uuid.UUID, stats: dict[str, int]
    ) -> Optional[WatchConfiguration]:
        """
        Update statistics for a watch configuration.

        Args:
            id: Configuration UUID
            stats: Statistics dictionary (from WatcherStats)

        Returns:
            Updated configuration or None
        """
        return self.update(id, stats=stats)

    def get_by_project(self, project_id: uuid.UUID) -> List[WatchConfiguration]:
        """
        Get watch configurations for a specific project.

        Args:
            project_id: Project UUID

        Returns:
            List of watch configurations
        """
        return (
            self.session.query(WatchConfiguration)
            .filter(WatchConfiguration.project_id == project_id)
            .all()
        )
