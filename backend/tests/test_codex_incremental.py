import json
from datetime import datetime, timedelta, timezone

from catsyphon.parsers.codex import CodexParser


def _ts(base: datetime, seconds: int) -> str:
    return (base + timedelta(seconds=seconds)).isoformat()


def _write_log(path, records):
    path.write_text("\n".join(json.dumps(r) for r in records) + "\n", encoding="utf-8")


def test_codex_incremental_appends_new_messages(tmp_path):
    parser = CodexParser()
    base_time = datetime(2025, 1, 1, tzinfo=timezone.utc)

    base_records = [
        {
            "timestamp": _ts(base_time, 0),
            "type": "session_meta",
            "payload": {
                "id": "sess-1",
                "cwd": "/tmp",
                "originator": "codex",
                "model_provider": "openai",
                "cli_version": "0.1",
            },
        },
        {
            "timestamp": _ts(base_time, 1),
            "type": "response_item",
            "payload": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "hi"}],
            },
        },
        {
            "timestamp": _ts(base_time, 2),
            "type": "response_item",
            "payload": {
                "type": "message",
                "role": "assistant",
                "content": [{"type": "output_text", "text": "hello"}],
            },
        },
    ]

    log_path = tmp_path / "codex.jsonl"
    _write_log(log_path, base_records)

    full = parser.parse(log_path)
    assert len(full.messages) == 2

    last_offset = log_path.stat().st_size
    last_line = len(base_records)

    appended_record = {
        "timestamp": _ts(base_time, 3),
        "type": "response_item",
        "payload": {
            "type": "message",
            "role": "assistant",
            "content": [{"type": "output_text", "text": "more"}],
        },
    }

    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(appended_record) + "\n")

    inc = parser.parse_incremental(log_path, last_offset, last_line)

    assert len(inc.new_messages) == 1
    assert inc.last_processed_line == last_line + 1
    assert inc.last_processed_offset == log_path.stat().st_size
    assert inc.new_messages[0].role == "assistant"
    assert "more" in inc.new_messages[0].content


def test_codex_incremental_defers_partial_line(tmp_path):
    parser = CodexParser()
    base_time = datetime(2025, 1, 1, tzinfo=timezone.utc)

    records = [
        {
            "timestamp": _ts(base_time, 0),
            "type": "session_meta",
            "payload": {"id": "sess-2"},
        },
    ]

    log_path = tmp_path / "codex.jsonl"
    _write_log(log_path, records)

    last_offset = log_path.stat().st_size
    last_line = len(records)

    # Append a partial JSON line (simulating writer mid-write)
    with log_path.open("ab") as f:
        f.write(b'{"timestamp": "' + _ts(base_time, 5).encode("utf-8"))

    inc = parser.parse_incremental(log_path, last_offset, last_line)

    # Should not advance past the partial line
    assert inc.new_messages == []
    assert inc.last_processed_offset == last_offset
    assert inc.last_processed_line == last_line
