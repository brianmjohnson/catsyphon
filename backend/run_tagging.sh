#!/bin/bash
# Change to script's directory
cd "$(dirname "$0")"

# Load environment
set -a
source ../.env
set +a

# Run ingestion with tagging
uv run python -m catsyphon.cli ingest ~/.claude/projects/ --project "Claude Code Sessions" --enable-tagging --force
