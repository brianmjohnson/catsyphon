"""Pytest fixtures for canonicalization tests."""

import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import event

from catsyphon.models.db import Base, Conversation, Epoch, Message, Organization, Workspace


@pytest.fixture(scope="session")
def async_test_engine():
    """Create async test database engine using SQLite in-memory."""
    from sqlalchemy import JSON
    from sqlalchemy.dialects import postgresql

    # Replace JSONB with JSON for SQLite
    @event.listens_for(Base.metadata, "before_create")
    def _set_json_type(target, connection, **kw):
        for table in target.tables.values():
            for column in table.columns:
                if isinstance(column.type, postgresql.JSONB):
                    column.type = JSON()

    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    # Create tables synchronously for test setup
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_until_complete(_create_tables(engine))

    yield engine

    loop.run_until_complete(engine.dispose())


async def _create_tables(engine):
    """Helper to create tables async."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@pytest.fixture(scope="function")
async def test_session(async_test_engine):
    """Create async test session with rollback."""
    async_session = async_sessionmaker(
        async_test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest.fixture
async def sample_organization(test_session):
    """Create a sample organization for testing."""
    org = Organization(
        name="Test Organization",
        slug="test-org",
    )
    test_session.add(org)
    await test_session.flush()
    await test_session.refresh(org)
    return org


@pytest.fixture
async def sample_workspace(test_session, sample_organization):
    """Create a sample workspace for testing."""
    workspace = Workspace(
        organization_id=sample_organization.id,
        name="Test Workspace",
        slug="test-workspace",
    )
    test_session.add(workspace)
    await test_session.flush()
    await test_session.refresh(workspace)
    return workspace


@pytest.fixture
async def sample_conversation(test_session, sample_workspace):
    """Create a sample conversation for testing."""
    conversation = Conversation(
        workspace_id=sample_workspace.id,
        agent_type="claude-code",
        agent_version="2.0.28",
        start_time=datetime.now(),
        status="completed",
        message_count=10,
        epoch_count=1,
    )
    test_session.add(conversation)
    await test_session.flush()
    await test_session.refresh(conversation)
    return conversation


@pytest.fixture
async def sample_epoch(test_session, sample_conversation):
    """Create a sample epoch for testing."""
    epoch = Epoch(
        conversation_id=sample_conversation.id,
        sequence=0,
        start_time=datetime.now(),
    )
    test_session.add(epoch)
    await test_session.flush()
    await test_session.refresh(epoch)
    return epoch


@pytest.fixture
async def sample_message(test_session, sample_conversation, sample_epoch):
    """Create a sample message for testing."""
    message = Message(
        conversation_id=sample_conversation.id,
        epoch_id=sample_epoch.id,
        role="user",
        content="Test message",
        timestamp=datetime.now(),
        sequence=0,
    )
    test_session.add(message)
    await test_session.flush()
    await test_session.refresh(message)
    return message
