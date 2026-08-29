import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberShield XDR"
    API_V1_STR: str = "/api"
    
    # Secure CORS allowed origins (comma-separated URLs)
    ALLOWED_ORIGINS: str = "*"

    # PostgreSQL Configuration
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_secure_pass_123"
    POSTGRES_DB: str = "cybershield"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    
    # Database URL
    DATABASE_URL: str = "postgresql://postgres:postgres_secure_pass_123@localhost:5432/cybershield"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # JWT Settings
    JWT_SECRET_KEY: str = "45e59b2d8614fb38e6583907c08a9c2d15fb38e6583907c08a9c2d15fb38e658"
    
    @field_validator("JWT_SECRET_KEY", mode="before")
    @classmethod
    def validate_jwt_secret_key(cls, v: str) -> str:
        # Support JWT_SECRET env var as a production-safe alias
        return os.getenv("JWT_SECRET") or v

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Initial Admin Seeding Credentials
    ADMIN_USERNAME: str = ""
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
