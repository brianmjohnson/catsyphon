"""Main module for catsyphon."""


def hello(name: str = "World") -> str:
    """Return a greeting message."""
    return f"Hello, {name}!"


def main() -> None:
    """Entry point for the application."""
    print(hello())


if __name__ == "__main__":
    main()
