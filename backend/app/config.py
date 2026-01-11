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
    jwt_expiry_days: int = 365
    
    # AI APIs
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    
    # Claude Models
    claude_haiku_model: str = "claude-haiku-4-5-20251001"
    claude_opus_model: str = "claude-opus-4-5-20251101"
    thinking_budget_tokens: int = 6000
    max_output_tokens: int = 8000
    
    # Paths
    codes_path: str = "codes"
    contracts_path: str = "contracts"
    chroma_db_path: str = "data/chroma_db"
    
    # Application
    debug: bool = False
    allowed_origins: str = "*"  # Comma-separated or "*" for all
    
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from string."""
        if self.allowed_origins == "*" or self.allowed_origins == '["*"]':
            return ["*"]
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
