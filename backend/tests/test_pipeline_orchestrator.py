import tempfile
from pathlib import Path

from catsyphon.parsers.registry import get_default_registry
from catsyphon.pipeline.orchestrator import ingest_log_file


def _write_jsonl(path: Path, lines: list[str]) -> None:
    path.write_text("\n".join(lines) + "\n")


def test_ingest_log_file_full_parse(db_session):
    """Integration: full parse + ingest via orchestrator creates conversation."""
    registry = get_default_registry()
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        path = Path(f.name)
    _write_jsonl(
        path,
        [
            '{"sessionId":"orchestrator-1","version":"2.0.17","type":"user","message":{"role":"user","content":"Hi"},"uuid":"m1","timestamp":"2025-01-01T00:00:00Z"}',
            '{"sessionId":"orchestrator-1","version":"2.0.17","type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hello"}]},"uuid":"m2","timestamp":"2025-01-01T00:00:01Z"}',
        ],
    )

    outcome = ingest_log_file(
        session=db_session,
        file_path=path,
        registry=registry,
        project_name=None,
        developer_username=None,
        tags=None,
        skip_duplicates=True,
        update_mode="skip",
        source_type="cli",
        source_config_id=None,
        created_by=None,
        enable_incremental=True,
    )
    db_session.commit()

    conv = outcome.conversation
    assert conv is not None
    assert outcome.status == "success"
    assert conv.message_count == 2


def test_ingest_log_file_incremental_append(db_session):
    """Integration: incremental append path increases message_count."""
    registry = get_default_registry()
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        path = Path(f.name)
    _write_jsonl(
        path,
        [
            '{"sessionId":"orchestrator-inc","version":"2.0.17","type":"user","message":{"role":"user","content":"Hi"},"uuid":"m1","timestamp":"2025-01-01T00:00:00Z"}',
        ],
    )

    outcome = ingest_log_file(
        session=db_session,
        file_path=path,
        registry=registry,
        enable_incremental=True,
    )
    db_session.commit()
    conv = outcome.conversation
    assert conv is not None
    assert conv.message_count == 1

    # Append a new line and re-run with incremental enabled
    _write_jsonl(
        path,
        [
            '{"sessionId":"orchestrator-inc","version":"2.0.17","type":"user","message":{"role":"user","content":"Hi"},"uuid":"m1","timestamp":"2025-01-01T00:00:00Z"}',
            '{"sessionId":"orchestrator-inc","version":"2.0.17","type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"More"}]},"uuid":"m2","timestamp":"2025-01-01T00:00:02Z"}',
        ],
    )

    outcome2 = ingest_log_file(
        session=db_session,
        file_path=path,
        registry=registry,
        enable_incremental=True,
    )
    db_session.commit()
    conv2 = outcome2.conversation
    assert conv2 is not None
    assert conv2.id == conv.id
    assert conv2.message_count == 2
    assert outcome2.incremental is True


def test_ingest_log_file_duplicate_returns_duplicate_status(db_session):
    """Ingesting the same file twice returns duplicate outcome."""
    registry = get_default_registry()
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        path = Path(f.name)
    _write_jsonl(
        path,
        [
            '{"sessionId":"orchestrator-dupe","version":"2.0.17","type":"user","message":{"role":"user","content":"Hi"},"uuid":"m1","timestamp":"2025-01-01T00:00:00Z"}',
        ],
    )

    first = ingest_log_file(session=db_session, file_path=path, registry=registry)
    db_session.commit()
    assert first.status == "success"
    assert first.conversation is not None

    second = ingest_log_file(session=db_session, file_path=path, registry=registry)
    db_session.commit()
    assert second.status == "duplicate"
    assert second.conversation is not None
    assert second.conversation.id == first.conversation.id
