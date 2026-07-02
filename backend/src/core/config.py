"""Application configuration using pydantic-settings.

Reads environment variables with the APP_ prefix from the .env file.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All environment variables must be prefixed with APP_, e.g. APP_DATABASE_URL.
    Values are read from a .env file located in the backend directory.
    """

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "sqlite+aiosqlite:///./aura_platform.db"

    # Security
    secret_key: str = "aura-dev-secret-key-change-in-production-2026"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Google Gemini
    gemini_api_key: str = "your-gemini-api-key-here"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # Environment
    environment: str = "development"

    @property
    def is_development(self) -> bool:
        """Check if the application is running in development mode."""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if the application is running in production mode."""
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings singleton.

    Uses lru_cache to ensure settings are loaded only once
    during the application lifecycle.
    """
    return Settings()
