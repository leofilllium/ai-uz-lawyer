"""
FastAPI Backend Configuration
Pydantic settings for environment variables.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://opus:opuslawyer@localhost:5432/opuslawyer"
    
    # Security
    secret_key: str = "super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_days: int = 7
    
    # AI APIs
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    
    # Claude Models
    claude_haiku_model: str = "claude-3-5-haiku-20241022"
    claude_opus_model: str = "claude-opus-4-5-20251101"
    thinking_budget_tokens: int = 8000
    
    # Paths
    codes_path: str = "codes"
    contracts_path: str = "contracts"
    chroma_db_path: str = "data/chroma_db"
    
    # Application
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
