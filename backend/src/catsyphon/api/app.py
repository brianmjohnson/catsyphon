"""
CatSyphon FastAPI Application.

Main API application for querying conversation data and insights.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CatSyphon API",
    description="API for analyzing coding agent conversation logs",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint - API health check."""
    return {
        "status": "ok",
        "message": "CatSyphon API is running",
        "version": "0.1.0",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    # TODO: Check database connection
    return {
        "status": "healthy",
        "database": "not_configured",
    }


# TODO: Add route imports when implemented
# from catsyphon.api.routes import conversations, stats, search
# app.include_router(
#     conversations.router, prefix="/conversations", tags=["conversations"]
# )
# app.include_router(stats.router, prefix="/stats", tags=["stats"])
# app.include_router(search.router, prefix="/search", tags=["search"])
