"""
Lightweight TTL cache for project analytics responses.

Used to avoid recalculating expensive aggregates on hot paths. The cache is
in-process only and should be invalidated after ingestion jobs complete to
keep live analytics fresh.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from threading import Lock
from typing import Any, Optional, Tuple
from uuid import UUID


@dataclass
class _CacheEntry:
    value: Any
    expires_at: float


class ProjectAnalyticsCache:
    def __init__(self, ttl_seconds: float):
        self._ttl = ttl_seconds
        self._data: dict[Tuple[str, Optional[str]], _CacheEntry] = {}
        self._lock = Lock()

    def get(self, project_id: UUID, date_range: Optional[str]) -> Optional[Any]:
        """Fetch a cached value if it exists and is not expired."""
        key = (str(project_id), date_range)
        now = time.time()
        with self._lock:
            entry = self._data.get(key)
            if not entry:
                return None
            if entry.expires_at <= now:
                self._data.pop(key, None)
                return None
            return entry.value

    def set(self, project_id: UUID, date_range: Optional[str], value: Any) -> None:
        """Store a value with TTL."""
        key = (str(project_id), date_range)
        expires_at = time.time() + self._ttl
        with self._lock:
            self._data[key] = _CacheEntry(value=value, expires_at=expires_at)

    def invalidate(self, project_id: Optional[UUID] = None) -> None:
        """
        Invalidate cached entries.

        If project_id is provided, only entries for that project are cleared;
        otherwise the entire cache is flushed.
        """
        with self._lock:
            if project_id is None:
                self._data.clear()
                return
            pid_str = str(project_id)
            keys = [k for k in self._data if k[0] == pid_str]
            for k in keys:
                self._data.pop(k, None)


# Singleton cache instance used by API routes and ingestion invalidation hooks.
PROJECT_ANALYTICS_CACHE = ProjectAnalyticsCache(ttl_seconds=300.0)
