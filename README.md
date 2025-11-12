# CatSyphon

**Coding agent conversation log analysis and insights tool**

CatSyphon parses, analyzes, and extracts insights from coding agent conversation logs (Claude Code, GitHub Copilot, Cursor, etc.). It provides analytics dashboards for engineering managers, product teams, and AI researchers to understand developer productivity, agent effectiveness, and development patterns.

## Features

### Phase 1: Data Foundation (Current)
- 📝 **Multi-agent log parsing** - Parse logs from Claude Code (with extensible plugin architecture)
- 👀 **Live directory watching** - Automatic ingestion of new conversation logs with file deduplication
- 🤖 **AI-powered tagging** - Enrich conversations with sentiment, intent, and outcome analysis
- 🗄️ **PostgreSQL storage** - Structured storage with rich metadata
- 🔍 **Query API** - REST API for accessing conversation data
- 💻 **CLI tool** - Command-line interface for ingestion and management
- 🖥️ **Web UI** - View and explore conversations with real-time freshness indicators

### Phase 2: Analytics Dashboards (Planned)
- 📊 Overview dashboard - Executive metrics and trends
- 🎯 Agent performance - Multi-agent comparative analytics
- 👥 Developer patterns - Usage analysis and insights
- 🔎 Conversation explorer - Search and filter conversations

### Phase 3: Developer Features (Planned)
- 🎨 Feature tracking - Automatic feature detection and progress
- 🔍 Semantic search - Natural language search across conversations
- 📋 Query templates - Pre-built and custom queries
- 🔔 Insight alerts - Automated pattern detection

## Tech Stack

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 15+** for data storage
- **OpenAI gpt-4o-mini** for AI tagging
- **SQLAlchemy 2.0** for ORM
- **Alembic** for migrations
- **Typer** for CLI

### Frontend (Phase 2)
- **React 18** with TypeScript
- **Vite** for build tooling
- **shadcn/ui** + **Tailwind CSS v4**
- **Tremor** for dashboard charts
- **TanStack Query** for data fetching
- **pnpm** for package management

## Prerequisites

- Python 3.11 or higher
- Node.js 20 LTS (for frontend)
- Docker and Docker Compose
- [mise](https://mise.jdx.dev/) (recommended for environment management)

## Quick Start

### 1. Clone and Setup Environment

```bash
git clone https://github.com/YOUR_ORG/catsyphon.git
cd catsyphon

# Install mise dependencies (Python, Node.js, pnpm)
mise install

# Copy environment template
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
uv sync --all-extras

# Run database migrations
uv run alembic upgrade head

cd ..
```

### 4. Run the Application

**Option A: CLI Commands**

```bash
cd backend

# Show help
uv run catsyphon --help

# Start API server
uv run catsyphon serve

# Ingest conversation logs
uv run catsyphon ingest path/to/logs --project "my-project"

# Watch directory for live ingestion
uv run catsyphon watch path/to/logs --project "my-project"

# Watch with verbose logging (includes SQL queries)
uv run catsyphon watch path/to/logs --verbose

# Check database status
uv run catsyphon db-status
```

**Option B: Direct API Server**

```bash
cd backend
uv run uvicorn catsyphon.api.app:app --reload
```

Visit http://localhost:8000/docs for interactive API documentation.

## Project Structure

```
catsyphon/                      # Monorepo root
├── backend/                    # Python backend
│   ├── src/catsyphon/          # Main package
│   │   ├── api/                # FastAPI application
│   │   ├── cli.py              # Typer CLI
│   │   ├── config.py           # Configuration
│   │   ├── db/                 # Database layer
│   │   ├── models/             # Data models
│   │   ├── parsers/            # Log parsers
│   │   ├── pipeline/           # Ingestion pipeline
│   │   ├── sdk/                # Python SDK
│   │   └── tagging/            # AI tagging engine
│   ├── tests/                  # Tests
│   └── pyproject.toml          # Dependencies
│
├── frontend/                   # React frontend (Phase 2)
│   └── src/                    # Source code
│
├── docs/                       # Documentation
│   └── implementation-plan.md  # Detailed technical plan
│
├── .mise.toml                  # Development environment
├── docker-compose.yml          # PostgreSQL setup
└── .env.example                # Environment template
```

## Development

### Backend Development

```bash
cd backend

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=src/catsyphon --cov-report=html

# Type checking
uv run mypy src/

# Format code
uv run black src/ tests/

# Lint
uv run ruff check src/ tests/

# Create database migration
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head
```

### Frontend Development (Phase 2)

```bash
cd frontend

# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm tsc --noEmit
```

### Database Management

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f postgres

# Access PostgreSQL CLI
docker exec -it catsyphon-postgres psql -U catsyphon -d catsyphon

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
cd backend && uv run alembic upgrade head
```

## Issue Tracking

This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking.

```bash
# Check ready work
bd ready

# Create new issue
bd create "Issue title" -t bug|feature|task -p 0-4

# Update issue status
bd update <issue-id> --status in_progress

# Close issue
bd close <issue-id> --reason "Completed"
```

See [AGENTS.md](./AGENTS.md) for detailed workflow.

## Environment Variables

See [.env.example](./.env.example) for all available configuration options.

Key variables:
- `OPENAI_API_KEY` - Your OpenAI API key (required for tagging)
- `DATABASE_URL` - PostgreSQL connection string
- `ENVIRONMENT` - `development` or `production`
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR)

## Cost Estimates

Using OpenAI gpt-4o-mini for tagging:
- **~$10 per 1,000 conversations**
- **~$10-15/month** for a team of 10 developers

See [docs/implementation-plan.md](./docs/implementation-plan.md) for detailed cost breakdown.

## Documentation

- [Implementation Plan](./docs/implementation-plan.md) - Comprehensive technical documentation
- [Agent Guidelines](./AGENTS.md) - Issue tracking workflow for AI agents
- [Claude Code Instructions](./CLAUDE.md) - Project-specific guidance

## Contributing

1. Check for ready work: `bd ready`
2. Claim a task: `bd update <id> --status in_progress`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes and test thoroughly
5. Commit changes: `git commit -m "Description"`
6. Update issue: `bd close <id> --reason "Completed"`
7. Push and create pull request

## License

[Add your license here]

## Support

- Report issues using `bd create`
- See [docs/](./docs/) for detailed documentation
- Review [AGENTS.md](./AGENTS.md) for development workflow

---

**Built with ❤️ for understanding developer-AI collaboration**
