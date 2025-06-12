"""
Configuration module for the FastAPI backend.
Loads environment variables from the top-level .env file.
"""
import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Find the top-level .env file by going up one directory
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
print(f"Loading settings from {ENV_FILE}")


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding='utf-8',
        case_sensitive=True,
        extra='allow',
    )

    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Daedalus Backtest API"

    # Debugging
    DEBUG: bool = True # Read from .env

    # CORS
    NEXT_PUBLIC_NEXT_API_URL: str
    NEXT_PUBLIC_BACKTEST_BACKEND_URL: str
    CORS_ORIGINS: Optional[List[str]] = None  # Read from .env

    # Database
    BACKTEST_DATABASE_URL: str

    # Database connection components (used if DATABASE_URL not provided)
    BACKTEST_DB_HOST: str
    BACKTEST_DB_PORT: str
    BACKTEST_DB_NAME: str
    BACKTEST_DB_USER: str
    BACKTEST_DB_PASSWORD: str

    # File paths
    UPLOAD_DIR: str = "./uploads"  # Default value, can be overridden in .env
    CORS_ORIGINS: str

    # Specific settings for Lean engine
    LEAN_BASE_DATA_PATH: Path = "/home/bena/Workspace/Synced/algotrading/lean/data"

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS_ORIGINS as a list, regardless of .env format."""
        origins = self.CORS_ORIGINS
        if isinstance(origins, str):
            self.CORS_ORIGINS = [origin.strip() for origin in origins.split(",") if origin.strip()]
        if isinstance(origins, list):
            self.CORS_ORIGINS = origins
        self.CORS_ORIGINS



# Create a global settings instance
settings = Settings()

print(settings.model_dump())
