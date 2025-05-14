# app/schemas/user.py
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional


# Базовые схемы для пользователя
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


# Схема для создания пользователя
class UserCreate(UserBase):
    password: str
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


# Схема для OAuth регистрации
class UserOAuthCreate(UserBase):
    oauth_provider: str
    oauth_id: str


# Схема для ответа
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Схема для обновления пользователя
class UserUpdate(BaseModel):
    full_name: Optional[str] = None


# Схема для профиля пользователя
class UserProfile(UserResponse):
    oauth_provider: Optional[str] = None