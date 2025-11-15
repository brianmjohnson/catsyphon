"""
Watch configuration API routes.

Endpoints for managing watch directory configurations.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from catsyphon.api.schemas import (
    WatchConfigurationCreate,
    WatchConfigurationResponse,
    WatchConfigurationUpdate,
)
from catsyphon.db.connection import get_db
from catsyphon.db.repositories import WatchConfigurationRepository

router = APIRouter()


@router.get("/watch/configs", response_model=list[WatchConfigurationResponse])
async def list_watch_configs(
    active_only: bool = False,
    session: Session = Depends(get_db),
) -> list[WatchConfigurationResponse]:
    """
    List all watch configurations.

    Args:
        active_only: If true, only return active configurations

    Returns:
        List of watch configurations
    """
    repo = WatchConfigurationRepository(session)

    if active_only:
        configs = repo.get_all_active()
    else:
        configs = repo.get_all()

    return [WatchConfigurationResponse.model_validate(c) for c in configs]


@router.get("/watch/configs/{config_id}", response_model=WatchConfigurationResponse)
async def get_watch_config(
    config_id: UUID,
    session: Session = Depends(get_db),
) -> WatchConfigurationResponse:
    """
    Get a specific watch configuration by ID.

    Args:
        config_id: Configuration UUID

    Returns:
        Watch configuration

    Raises:
        HTTPException: 404 if configuration not found
    """
    repo = WatchConfigurationRepository(session)
    config = repo.get(config_id)

    if not config:
        raise HTTPException(status_code=404, detail="Watch configuration not found")

    return WatchConfigurationResponse.model_validate(config)


@router.post("/watch/configs", response_model=WatchConfigurationResponse, status_code=201)
async def create_watch_config(
    config: WatchConfigurationCreate,
    session: Session = Depends(get_db),
) -> WatchConfigurationResponse:
    """
    Create a new watch configuration.

    Args:
        config: Watch configuration data

    Returns:
        Created watch configuration

    Raises:
        HTTPException: 400 if directory already exists
    """
    repo = WatchConfigurationRepository(session)

    # Check if directory already exists
    existing = repo.get_by_directory(config.directory)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Watch configuration already exists for directory: {config.directory}",
        )

    # Create new configuration
    new_config = repo.create(
        directory=config.directory,
        project_id=config.project_id,
        developer_id=config.developer_id,
        enable_tagging=config.enable_tagging,
        extra_config=config.extra_config,
        created_by=config.created_by,
        is_active=False,  # Start as inactive
        stats={},
    )

    session.commit()

    return WatchConfigurationResponse.model_validate(new_config)


@router.put("/watch/configs/{config_id}", response_model=WatchConfigurationResponse)
async def update_watch_config(
    config_id: UUID,
    config: WatchConfigurationUpdate,
    session: Session = Depends(get_db),
) -> WatchConfigurationResponse:
    """
    Update a watch configuration.

    Args:
        config_id: Configuration UUID
        config: Updated configuration data

    Returns:
        Updated watch configuration

    Raises:
        HTTPException: 404 if configuration not found
    """
    repo = WatchConfigurationRepository(session)

    # Build update dict (only include non-None values)
    update_data = {
        k: v for k, v in config.model_dump().items() if v is not None
    }

    updated_config = repo.update(config_id, **update_data)

    if not updated_config:
        raise HTTPException(status_code=404, detail="Watch configuration not found")

    session.commit()

    return WatchConfigurationResponse.model_validate(updated_config)


@router.delete("/watch/configs/{config_id}", status_code=204)
async def delete_watch_config(
    config_id: UUID,
    session: Session = Depends(get_db),
) -> None:
    """
    Delete a watch configuration.

    Args:
        config_id: Configuration UUID

    Raises:
        HTTPException: 404 if configuration not found
        HTTPException: 400 if configuration is active
    """
    repo = WatchConfigurationRepository(session)

    config = repo.get(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Watch configuration not found")

    if config.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an active watch configuration. Stop it first.",
        )

    repo.delete(config_id)
    session.commit()


@router.post("/watch/configs/{config_id}/start", response_model=WatchConfigurationResponse)
async def start_watching(
    config_id: UUID,
    session: Session = Depends(get_db),
) -> WatchConfigurationResponse:
    """
    Activate a watch configuration (start watching).

    Args:
        config_id: Configuration UUID

    Returns:
        Updated watch configuration

    Raises:
        HTTPException: 404 if configuration not found
    """
    repo = WatchConfigurationRepository(session)

    updated_config = repo.activate(config_id)

    if not updated_config:
        raise HTTPException(status_code=404, detail="Watch configuration not found")

    session.commit()

    return WatchConfigurationResponse.model_validate(updated_config)


@router.post("/watch/configs/{config_id}/stop", response_model=WatchConfigurationResponse)
async def stop_watching(
    config_id: UUID,
    session: Session = Depends(get_db),
) -> WatchConfigurationResponse:
    """
    Deactivate a watch configuration (stop watching).

    Args:
        config_id: Configuration UUID

    Returns:
        Updated watch configuration

    Raises:
        HTTPException: 404 if configuration not found
    """
    repo = WatchConfigurationRepository(session)

    updated_config = repo.deactivate(config_id)

    if not updated_config:
        raise HTTPException(status_code=404, detail="Watch configuration not found")

    session.commit()

    return WatchConfigurationResponse.model_validate(updated_config)


@router.get("/watch/status")
async def get_watch_status(
    session: Session = Depends(get_db),
) -> dict[str, int | list[WatchConfigurationResponse]]:
    """
    Get overall watch daemon status.

    Returns:
        Dictionary with watch status information
    """
    repo = WatchConfigurationRepository(session)

    active_configs = repo.get_all_active()
    inactive_configs = repo.get_all_inactive()

    return {
        "total_configs": repo.count(),
        "active_count": len(active_configs),
        "inactive_count": len(inactive_configs),
        "active_configs": [
            WatchConfigurationResponse.model_validate(c) for c in active_configs
        ],
    }
