# app/services/auth.py
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import Token, OAuthLoginRequest
from app.schemas.user import UserCreate, UserOAuthCreate
from app.utils.security import SecurityUtils
from app.config import settings
import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate, db: Session) -> User:
        """Регистрация нового пользователя"""
        # Проверяем, существует ли пользователь
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Валидация пароля
        is_strong, message = SecurityUtils.password_strength_validator(user_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        # Создаем пользователя
        hashed_password = SecurityUtils.get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    async def login_user(email: str, password: str, db: Session) -> Token:
        """Вход пользователя"""
        # Находим пользователя
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Проверяем пароль
        if not SecurityUtils.verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Проверяем активность пользователя
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )

        # Создаем токены
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    async def refresh_token(refresh_token: str, db: Session) -> Token:
        """Обновление токенов"""
        # Декодируем refresh токен
        payload = SecurityUtils.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user"
            )

        # Создаем новые токены
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        new_refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token
        )

    @staticmethod
    async def oauth_login(oauth_data: OAuthLoginRequest, db: Session) -> Token:
        """OAuth вход/регистрация"""
        user_info = None

        if oauth_data.provider == "google":
            user_info = await AuthService._verify_google_token(oauth_data.id_token)
        elif oauth_data.provider == "apple":
            user_info = await AuthService._verify_apple_token(oauth_data.id_token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth provider"
            )

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OAuth token"
            )

        # Ищем или создаем пользователя
        user = db.query(User).filter(
            User.email == user_info["email"]
        ).first()

        if not user:
            # Создаем нового пользователя
            user = User(
                email=user_info["email"],
                full_name=user_info.get("name", ""),
                oauth_provider=oauth_data.provider,
                oauth_id=user_info["sub"],
                is_verified=True  # OAuth пользователи считаются верифицированными
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Обновляем данные существующего пользователя
            if not user.oauth_provider:
                user.oauth_provider = oauth_data.provider
                user.oauth_id = user_info["sub"]
                db.commit()

        # Создаем токены
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    async def _verify_google_token(token: str) -> Optional[dict]:
        """Верификация Google токена"""
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            return {
                "email": idinfo["email"],
                "name": idinfo.get("name", ""),
                "sub": idinfo["sub"]
            }
        except ValueError:
            return None

    @staticmethod
    async def _verify_apple_token(token: str) -> Optional[dict]:
        """Верификация Apple токена"""
        # Здесь должна быть логика верификации Apple токена
        # Это более сложный процесс, требующий работы с Apple API
        pass

    @staticmethod
    async def request_password_reset(email: str, db: Session) -> None:
        """Запрос на сброс пароля"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Не раскрываем информацию о существовании пользователя
            return

        # Генерируем токен сброса
        reset_token = SecurityUtils.generate_reset_token()
        user.reset_password_token = reset_token
        user.reset_password_token_expires = datetime.utcnow() + timedelta(hours=1)

        db.commit()

        # Здесь должна быть отправка email с токеном
        # TODO: Implement email sending

    @staticmethod
    async def reset_password(token: str, new_password: str, db: Session) -> None:
        """Сброс пароля"""
        user = db.query(User).filter(
            User.reset_password_token == token,
            User.reset_password_token_expires > datetime.utcnow()
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        # Валидация нового пароля
        is_strong, message = SecurityUtils.password_strength_validator(new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        # Обновляем пароль
        user.hashed_password = SecurityUtils.get_password_hash(new_password)
        user.reset_password_token = None
        user.reset_password_token_expires = None

        db.commit()