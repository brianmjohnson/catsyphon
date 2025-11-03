"""
CatSyphon CLI - Main command-line interface for CatSyphon.

Provides commands for ingesting conversation logs, running the API server,
and managing the database.
"""

import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(
    name="catsyphon",
    help="CatSyphon - Coding agent conversation analysis tool",
    no_args_is_help=True,
)

console = Console()


@app.command()
def version() -> None:
    """Show CatSyphon version."""
    console.print("[bold green]CatSyphon v0.1.0[/bold green]")


@app.command()
def ingest(
    path: str = typer.Argument(..., help="Path to conversation log file or directory"),
    project: str = typer.Option(None, help="Project name"),
    developer: str = typer.Option(None, help="Developer username"),
    batch: bool = typer.Option(False, help="Process directory in batch mode"),
) -> None:
    """
    Ingest conversation logs into the database.

    Parse and tag conversation logs, then store them in the database
    for analysis.
    """
    console.print(f"[bold blue]Ingesting logs from:[/bold blue] {path}")
    console.print(f"  Project: {project or 'N/A'}")
    console.print(f"  Developer: {developer or 'N/A'}")
    console.print(f"  Batch mode: {batch}")

    # TODO: Implement ingestion pipeline
    console.print("[yellow]⚠ Ingestion not yet implemented[/yellow]")


@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", help="Host to bind to"),
    port: int = typer.Option(8000, help="Port to bind to"),
    reload: bool = typer.Option(False, help="Enable auto-reload"),
) -> None:
    """
    Start the FastAPI server.

    Runs the CatSyphon API server for querying conversation data.
    """
    import uvicorn

    console.print("[bold green]Starting CatSyphon API server...[/bold green]")
    console.print(f"  Host: {host}")
    console.print(f"  Port: {port}")
    console.print(f"  Reload: {reload}")
    console.print(f"\n  API docs: http://{host}:{port}/docs")

    uvicorn.run(
        "catsyphon.api.app:app",
        host=host,
        port=port,
        reload=reload,
    )


@app.command()
def db_init() -> None:
    """Initialize the database (run migrations)."""
    console.print("[bold blue]Initializing database...[/bold blue]")

    # TODO: Run Alembic migrations
    console.print("[yellow]⚠ Database initialization not yet implemented[/yellow]")
    console.print("  Hint: Use 'alembic upgrade head' to run migrations")


@app.command()
def db_status() -> None:
    """Show database status and statistics."""
    console.print("[bold blue]Database Status[/bold blue]\n")

    # TODO: Query database for stats
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Metric")
    table.add_column("Value", justify="right")

    table.add_row("Conversations", "0")
    table.add_row("Messages", "0")
    table.add_row("Developers", "0")
    table.add_row("Projects", "0")

    console.print(table)
    console.print("\n[yellow]⚠ Database queries not yet implemented[/yellow]")


if __name__ == "__main__":
    app()
