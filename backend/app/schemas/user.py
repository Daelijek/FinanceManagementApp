# app/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, date
from typing import Optional


# Базовые схемы для пользователя
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


# Схема для создания пользователя
class UserCreate(UserBase):
    password: str
    confirm_password: str

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
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
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    tax_residence: Optional[str] = None


# Схема для персональной информации пользователя
class UserPersonalInfo(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    tax_residence: Optional[str] = None

    class Config:
        from_attributes = True


# Схема для профиля пользователя
class UserProfile(UserResponse):
    oauth_provider: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    tax_residence: Optional[str] = None