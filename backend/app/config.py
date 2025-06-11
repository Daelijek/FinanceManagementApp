# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Основные настройки
    PROJECT_NAME: str = "Financial App Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Настройки для загрузки файлов
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10_485_760  # 10 МБ

    # Безопасность
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENAI_API_KEY: str = ""

    # База данных
    DATABASE_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    # Email (для сброса пароля)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Настройки токена сброса пароля
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1

    # OAuth (Google)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None

    # OAuth (Microsoft)
    MICROSOFT_CLIENT_ID: Optional[str] = None
    MICROSOFT_CLIENT_SECRET: Optional[str] = None
    MICROSOFT_REDIRECT_URI: Optional[str] = None
    MICROSOFT_TENANT: str = "common"  # common, organizations, consumers, <tenant_id>

    # URL приложения (для ссылок в email)
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()