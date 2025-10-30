"""Tests for catsyphon."""

import pytest
from catsyphon import hello, main


def test_hello_default():
    """Test hello with default argument."""
    assert hello() == "Hello, World!"


def test_hello_custom():
    """Test hello with custom name."""
    assert hello("Python") == "Hello, Python!"


def test_main(capsys):
    """Test main function output."""
    main()
    captured = capsys.readouterr()
    assert "Hello, World!" in captured.out
