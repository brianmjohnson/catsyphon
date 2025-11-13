"""Tests for rule-based conversation tagger."""

from datetime import datetime

import pytest

from catsyphon.models.parsed import ParsedConversation, ParsedMessage
from catsyphon.tagging.rule_tagger import RuleTagger


@pytest.fixture
def rule_tagger() -> RuleTagger:
    """Create a rule tagger instance."""
    return RuleTagger()


@pytest.fixture
def sample_conversation() -> ParsedConversation:
    """Create a sample parsed conversation."""
    return ParsedConversation(
        agent_type="claude-code",
        agent_version="1.0.0",
        start_time=datetime(2025, 1, 1, 10, 0, 0),
        end_time=datetime(2025, 1, 1, 10, 30, 0),
        messages=[
            ParsedMessage(
                role="user",
                content="Can you help me fix this bug?",
                timestamp=datetime(2025, 1, 1, 10, 0, 0),
            ),
            ParsedMessage(
                role="assistant",
                content="I'll help you debug this issue. Let me read the file first.",
                timestamp=datetime(2025, 1, 1, 10, 1, 0),
            ),
        ],
    )


class TestRuleTagger:
    """Tests for RuleTagger class."""

    def test_tag_conversation_basic(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test basic tagging functionality."""
        tags = rule_tagger.tag_conversation(sample_conversation)

        assert tags is not None
        assert isinstance(tags.has_errors, bool)
        assert isinstance(tags.tools_used, list)
        assert isinstance(tags.patterns, list)
        assert tags.iterations == 1

    def test_detect_errors_no_errors(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test that clean conversations don't trigger error detection."""
        tags = rule_tagger.tag_conversation(sample_conversation)
        assert tags.has_errors is False

    def test_detect_errors_with_error_keyword(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test error detection with error keyword."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Error: File not found. The operation failed.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert tags.has_errors is True

    def test_detect_errors_with_exception(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test error detection with exception."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Traceback: ValueError exception occurred during execution.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert tags.has_errors is True

    def test_detect_errors_with_warning(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test error detection with warning."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Warning: Deprecated function usage detected.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert tags.has_errors is True

    def test_extract_tools_bash(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test tool extraction for bash commands."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Running bash command: ls -la",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "bash" in tags.tools_used

    def test_extract_tools_read_file(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test tool extraction for read file operations."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Let me read file src/main.py to check the code.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "read" in tags.tools_used

    def test_extract_tools_write_file(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test tool extraction for write file operations."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="I'll write file config.json with the new settings.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "write" in tags.tools_used

    def test_extract_tools_edit_file(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test tool extraction for edit file operations."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Let me edit file README.md to update the docs.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "edit" in tags.tools_used

    def test_extract_tools_git(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test tool extraction for git commands."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Running git commit -m 'Update feature'",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "git" in tags.tools_used

    def test_extract_tools_test(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test tool extraction for test commands."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Running pytest to verify the changes.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "test" in tags.tools_used

    def test_extract_tools_multiple(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test extraction of multiple tools."""
        sample_conversation.messages.extend(
            [
                ParsedMessage(
                    role="assistant",
                    content="Let me read file app.py",
                    timestamp=datetime(2025, 1, 1, 10, 2, 0),
                ),
                ParsedMessage(
                    role="assistant",
                    content="Now I'll run git status",
                    timestamp=datetime(2025, 1, 1, 10, 3, 0),
                ),
                ParsedMessage(
                    role="assistant",
                    content="Running pytest tests",
                    timestamp=datetime(2025, 1, 1, 10, 4, 0),
                ),
            ]
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "read" in tags.tools_used
        assert "git" in tags.tools_used
        assert "test" in tags.tools_used
        assert len(tags.tools_used) == 3

    def test_extract_patterns_long_conversation(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test pattern detection for long conversations."""
        # Add 60 messages to make it a long conversation
        for i in range(60):
            sample_conversation.messages.append(
                ParsedMessage(
                    role="user" if i % 2 == 0 else "assistant",
                    content=f"Message {i}",
                    timestamp=datetime(2025, 1, 1, 10, i, 0),
                )
            )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "long_conversation" in tags.patterns

    def test_extract_patterns_quick_resolution(self, rule_tagger: RuleTagger):
        """Test pattern detection for quick resolutions."""
        quick_conversation = ParsedConversation(
            agent_type="claude-code",
            agent_version="1.0.0",
            start_time=datetime(2025, 1, 1, 10, 0, 0),
            end_time=datetime(2025, 1, 1, 10, 1, 0),
            messages=[
                ParsedMessage(
                    role="user",
                    content="Fix typo in README",
                    timestamp=datetime(2025, 1, 1, 10, 0, 0),
                ),
                ParsedMessage(
                    role="assistant",
                    content="Fixed!",
                    timestamp=datetime(2025, 1, 1, 10, 0, 30),
                ),
            ],
        )

        tags = rule_tagger.tag_conversation(quick_conversation)
        assert "quick_resolution" in tags.patterns

    def test_extract_patterns_type_checking(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test pattern detection for type checking."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Running mypy for type checking",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "type_checking" in tags.patterns

    def test_extract_patterns_testing(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test pattern detection for testing."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Running pytest with coverage",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "testing" in tags.patterns

    def test_extract_patterns_debugging(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test pattern detection for debugging."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Let me add some debug print statements to investigate.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "debugging" in tags.patterns

    def test_extract_patterns_dependency_management(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test pattern detection for dependency management."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Installing package dependencies from requirements.txt",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "dependency_management" in tags.patterns

    def test_extract_patterns_refactoring(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test pattern detection for refactoring."""
        sample_conversation.messages.append(
            ParsedMessage(
                role="assistant",
                content="Let me refactor this code to improve readability.",
                timestamp=datetime(2025, 1, 1, 10, 2, 0),
            )
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        assert "refactoring" in tags.patterns

    def test_tools_are_sorted(
        self, rule_tagger: RuleTagger, sample_conversation: ParsedConversation
    ):
        """Test that extracted tools are sorted alphabetically."""
        sample_conversation.messages.extend(
            [
                ParsedMessage(
                    role="assistant",
                    content="Running git status",
                    timestamp=datetime(2025, 1, 1, 10, 2, 0),
                ),
                ParsedMessage(
                    role="assistant",
                    content="Let me read file app.py",
                    timestamp=datetime(2025, 1, 1, 10, 3, 0),
                ),
                ParsedMessage(
                    role="assistant",
                    content="Running bash command",
                    timestamp=datetime(2025, 1, 1, 10, 4, 0),
                ),
            ]
        )

        tags = rule_tagger.tag_conversation(sample_conversation)
        # Check that tools are sorted: bash, git, read
        assert tags.tools_used == sorted(tags.tools_used)
