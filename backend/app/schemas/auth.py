# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


# Схема для входа
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Схема для токенов
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Схема для обновления токена
class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Схема для восстановления пароля
class PasswordResetRequest(BaseModel):
    email: EmailStr


# Схема для установки нового пароля
class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


# Схема для OAuth входа
class OAuthLoginRequest(BaseModel):
    provider: str  # 'google' или 'apple'
    access_token: str  # Токен от OAuth провайдера
    id_token: Optional[str] = None  # Для получения данных пользователя