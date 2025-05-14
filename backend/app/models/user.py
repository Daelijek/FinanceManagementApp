# app/models/user.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable для OAuth пользователей
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # OAuth поля
    oauth_provider = Column(String, nullable=True)  # 'google', 'apple', None
    oauth_id = Column(String, nullable=True)

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Токен для сброса пароля
    reset_password_token = Column(String, nullable=True)
    reset_password_token_expires = Column(DateTime(timezone=True), nullable=True)