# app/services/auth.py

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import Token, OAuthLoginRequest, PasswordResetRequest, PasswordResetConfirm
from app.schemas.user import UserCreate, UserOAuthCreate
from app.utils.security import SecurityUtils
from app.config import settings

from app.services.profile import ProfileService
from app.schemas.profile import ProfileCreate, FinancialDataCreate
from app.models.financial import SubscriptionTypeEnum

# Для OAuth Google
import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

# Для отправки писем
from app.utils.mailer import send_reset_email


class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate, db: Session) -> User:
        """Регистрация нового пользователя"""
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        is_strong, message = SecurityUtils.password_strength_validator(user_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        hashed_password = SecurityUtils.get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        # Создаём профиль и финансовые данные
        profile = await ProfileService.create_profile(user.id, ProfileCreate(), db)
        expires_at = datetime.utcnow() + timedelta(days=365)
        await ProfileService.update_subscription(
            user.id,
            SubscriptionTypeEnum.FREE,
            expires_at,
            db
        )
        await ProfileService.create_financial_data(
            profile.id,
            FinancialDataCreate(balance=0.0, savings=0.0, credit_score=0),
            db
        )

        return user

    @staticmethod
    async def login_user(email: str, password: str, db: Session) -> Token:
        """Вход пользователя"""
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not SecurityUtils.verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )

        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(access_token=access_token, refresh_token=refresh_token)

    @staticmethod
    async def refresh_token(refresh_token: str, db: Session) -> Token:
        """Обновление токенов"""
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

        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        new_refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(access_token=access_token, refresh_token=new_refresh_token)

    @staticmethod
    async def oauth_login(oauth_data: OAuthLoginRequest, db: Session) -> Token:
        """OAuth вход/регистрация"""
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

        user = db.query(User).filter(User.email == user_info["email"]).first()
        if not user:
            user = User(
                email=user_info["email"],
                full_name=user_info.get("name", ""),
                oauth_provider=oauth_data.provider,
                oauth_id=user_info["sub"],
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if not user.oauth_provider:
                user.oauth_provider = oauth_data.provider
                user.oauth_id = user_info["sub"]
                db.commit()

        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(access_token=access_token, refresh_token=refresh_token)

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
        """Верификация Apple токена (заглушка)"""
        # TODO: добавить логику проверки Apple ID token
        return None

    @staticmethod
    async def request_password_reset(email: str, db: Session) -> None:
        """Запрос на сброс пароля"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return  # безопасность: не даём знать, есть ли такая учётка

        # Генерация и сохранение токена
        reset_token = SecurityUtils.generate_reset_token()
        user.reset_password_token = reset_token
        user.reset_password_token_expires = (
            datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        )
        db.commit()

        # Отправка письма
        try:
            await send_reset_email(user.email, reset_token)
            print(f"[INFO] Reset email sent to {user.email}")
        except Exception as e:
            print(f"[WARNING] Could not send reset email: {e}")

    @staticmethod
    async def reset_password(token: str, new_password: str, db: Session) -> None:
        """Подтверждение сброса пароля"""
        user = db.query(User).filter(
            User.reset_password_token == token,
            User.reset_password_token_expires > datetime.utcnow()
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        is_strong, message = SecurityUtils.password_strength_validator(new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        user.hashed_password = SecurityUtils.get_password_hash(new_password)
        user.reset_password_token = None
        user.reset_password_token_expires = None
        db.commit()