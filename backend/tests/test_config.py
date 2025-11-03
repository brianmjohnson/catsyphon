"""
Tests for configuration management.
"""

from catsyphon.config import Settings


class TestSettings:
    """Tests for Settings configuration."""

    def test_default_database_settings(self):
        """Test default database settings."""
        settings = Settings()

        assert settings.postgres_db == "catsyphon"
        assert settings.postgres_user == "catsyphon"
        assert settings.postgres_host == "localhost"
        assert settings.postgres_port == 5432

    def test_database_url_construction(self):
        """Test database URL is correctly constructed."""
        settings = Settings(
            postgres_user="testuser",
            postgres_password="testpass",
            postgres_host="testhost",
            postgres_port=5433,
            postgres_db="testdb",
        )

        expected_url = "postgresql://testuser:testpass@testhost:5433/testdb"
        assert settings.database_url == expected_url

    def test_default_openai_settings(self):
        """Test default OpenAI settings."""
        settings = Settings()

        assert settings.openai_model == "gpt-4o-mini"
        assert settings.openai_max_tokens == 2000

    def test_default_api_settings(self):
        """Test default API settings."""
        settings = Settings()

        assert settings.api_host == "0.0.0.0"
        assert settings.api_port == 8000
        assert settings.api_reload is True

    def test_default_environment_settings(self):
        """Test default environment settings."""
        settings = Settings()

        assert settings.environment == "development"
        assert settings.log_level == "INFO"

    def test_settings_from_env_vars(self, monkeypatch):
        """Test that settings can be overridden by environment variables."""
        # Set environment variables
        monkeypatch.setenv("POSTGRES_DB", "custom_db")
        monkeypatch.setenv("POSTGRES_PORT", "6000")
        monkeypatch.setenv("OPENAI_MODEL", "gpt-4")
        monkeypatch.setenv("ENVIRONMENT", "production")

        settings = Settings()

        assert settings.postgres_db == "custom_db"
        assert settings.postgres_port == 6000
        assert settings.openai_model == "gpt-4"
        assert settings.environment == "production"

    def test_case_insensitive_env_vars(self, monkeypatch):
        """Test that environment variables are case-insensitive."""
        monkeypatch.setenv("postgres_db", "lowercase_db")

        settings = Settings()

        assert settings.postgres_db == "lowercase_db"

    def test_settings_immutability(self):
        """Test that settings values can be accessed."""
        settings = Settings()

        # Should be able to read values
        assert isinstance(settings.postgres_port, int)
        assert isinstance(settings.postgres_db, str)
        assert isinstance(settings.api_reload, bool)

    def test_openai_api_key_default_empty(self, monkeypatch):
        """Test that OpenAI API key defaults to empty string."""
        # Clear any environment variable
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)

        settings = Settings()

        # Default should be empty, not None
        assert settings.openai_api_key == ""

    def test_all_required_settings_present(self):
        """Test that all expected settings are present."""
        settings = Settings()

        # Database settings
        assert hasattr(settings, "postgres_db")
        assert hasattr(settings, "postgres_user")
        assert hasattr(settings, "postgres_password")
        assert hasattr(settings, "postgres_host")
        assert hasattr(settings, "postgres_port")
        assert hasattr(settings, "database_url")

        # OpenAI settings
        assert hasattr(settings, "openai_api_key")
        assert hasattr(settings, "openai_model")
        assert hasattr(settings, "openai_max_tokens")

        # API settings
        assert hasattr(settings, "api_host")
        assert hasattr(settings, "api_port")
        assert hasattr(settings, "api_reload")

        # Application settings
        assert hasattr(settings, "environment")
        assert hasattr(settings, "log_level")
