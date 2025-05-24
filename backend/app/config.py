# app/config.py

from pydantic_settings import BaseSettings
from pydantic import EmailStr
from typing import List, Optional

class Settings(BaseSettings):
    # Основные
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

    # База данных
    DATABASE_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
    ]

    # Email (сброс пароля)
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: EmailStr
    SMTP_PASSWORD: str
    EMAILS_FROM_EMAIL: EmailStr
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    # Время жизни reset-токена (в часах)
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1

    # OAuth (Google и Apple)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    APPLE_CLIENT_ID: Optional[str] = None
    APPLE_CLIENT_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # игнорировать «лишние» переменные

# глобальный экземпляр настроек
settings = Settings()