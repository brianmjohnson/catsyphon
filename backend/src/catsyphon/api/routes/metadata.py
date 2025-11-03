"""
Metadata API routes.

Endpoints for querying projects, developers, and other metadata.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from catsyphon.api.schemas import DeveloperResponse, ProjectResponse
from catsyphon.db.connection import get_db
from catsyphon.db.repositories import DeveloperRepository, ProjectRepository

router = APIRouter()


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    session: Session = Depends(get_db),
) -> list[ProjectResponse]:
    """
    List all projects.

    Returns all projects in the system, useful for filter dropdowns.
    """
    repo = ProjectRepository(session)
    projects = repo.get_all()

    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/developers", response_model=list[DeveloperResponse])
async def list_developers(
    session: Session = Depends(get_db),
) -> list[DeveloperResponse]:
    """
    List all developers.

    Returns all developers in the system, useful for filter dropdowns.
    """
    repo = DeveloperRepository(session)
    developers = repo.get_all()

    return [DeveloperResponse.model_validate(d) for d in developers]
