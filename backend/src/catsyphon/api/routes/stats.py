"""
Statistics API routes.

Endpoints for querying analytics and statistics about conversations.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from catsyphon.api.schemas import OverviewStats
from catsyphon.db.connection import get_db
from catsyphon.db.repositories import (
    ConversationRepository,
    DeveloperRepository,
    ProjectRepository,
)
from catsyphon.models.db import Conversation, Message

router = APIRouter()


@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    start_date: Optional[datetime] = Query(None, description="Filter start date"),
    end_date: Optional[datetime] = Query(None, description="Filter end date"),
    session: Session = Depends(get_db),
) -> OverviewStats:
    """
    Get overview statistics.

    Returns high-level metrics about conversations, messages, projects, and developers.
    Optionally filtered by date range.
    """
    conv_repo = ConversationRepository(session)
    proj_repo = ProjectRepository(session)
    dev_repo = DeveloperRepository(session)

    # Build date filter
    date_filter = {}
    if start_date:
        date_filter["start_date"] = start_date
    if end_date:
        date_filter["end_date"] = end_date

    # Total conversations (with optional date filter)
    total_conversations = conv_repo.count_by_filters(**date_filter)

    # Total messages (requires custom query if date filtered)
    if date_filter:
        # Count messages in conversations within date range
        query = session.query(func.count(Message.id)).join(Conversation)
        if start_date:
            query = query.filter(Conversation.start_time >= start_date)
        if end_date:
            query = query.filter(Conversation.start_time <= end_date)
        total_messages = query.scalar() or 0
    else:
        # Simple count of all messages
        total_messages = session.query(func.count(Message.id)).scalar() or 0

    # Total projects and developers (not date filtered)
    total_projects = proj_repo.count()
    total_developers = dev_repo.count()

    # Conversations by status
    conversations_by_status = {}
    status_counts = (
        session.query(Conversation.status, func.count(Conversation.id))
        .group_by(Conversation.status)
        .all()
    )
    for status, count in status_counts:
        conversations_by_status[status or "unknown"] = count

    # Conversations by agent type
    conversations_by_agent = {}
    agent_counts = (
        session.query(Conversation.agent_type, func.count(Conversation.id))
        .group_by(Conversation.agent_type)
        .all()
    )
    for agent_type, count in agent_counts:
        conversations_by_agent[agent_type] = count

    # Recent conversations (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_conversations = conv_repo.count_by_filters(start_date=seven_days_ago)

    # Success rate (percentage of conversations with success=True)
    total_with_success = (
        session.query(func.count(Conversation.id))
        .filter(Conversation.success.isnot(None))
        .scalar()
        or 0
    )
    if total_with_success > 0:
        successful = (
            session.query(func.count(Conversation.id))
            .filter(Conversation.success == True)  # noqa: E712
            .scalar()
            or 0
        )
        success_rate = (successful / total_with_success) * 100
    else:
        success_rate = None

    return OverviewStats(
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_projects=total_projects,
        total_developers=total_developers,
        conversations_by_status=conversations_by_status,
        conversations_by_agent=conversations_by_agent,
        recent_conversations=recent_conversations,
        success_rate=success_rate,
    )
