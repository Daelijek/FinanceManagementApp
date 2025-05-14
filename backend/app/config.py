# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Основные настройки
    PROJECT_NAME: str = "Financial App Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Безопасность
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # База данных
    DATABASE_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    # Email (для сброса пароля)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None

    # OAuth (Google, Apple)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    APPLE_CLIENT_ID: Optional[str] = None
    APPLE_CLIENT_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()