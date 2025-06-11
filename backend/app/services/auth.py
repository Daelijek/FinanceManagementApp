# app/services/auth.py
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import Token, OAuthLoginRequest
from app.schemas.user import UserCreate, UserOAuthCreate
from app.utils.security import SecurityUtils
from app.config import settings
from app.services.profile import ProfileService
from app.schemas.profile import ProfileCreate, FinancialDataCreate
from app.models.financial import SubscriptionTypeEnum
from app.utils.oauth import GoogleOAuth, MicrosoftOAuth
from app.utils.mailer import send_reset_email, send_verification_email
import os
import uuid
import logging

logger = logging.getLogger(__name__)


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

        # Создаем профиль с бесплатной подпиской
        profile_data = ProfileCreate()
        profile = await ProfileService.create_profile(user.id, profile_data, db)

        # Устанавливаем тип подписки и срок действия
        expires_at = datetime.utcnow() + timedelta(days=365)  # Бесплатно на год
        await ProfileService.update_subscription(user.id, SubscriptionTypeEnum.FREE, expires_at, db)

        # Создаем начальные финансовые данные
        financial_data = FinancialDataCreate(
            balance=0.0,
            savings=0.0,
            credit_score=0
        )
        await ProfileService.create_financial_data(profile.id, financial_data, db)

        # Отправляем письмо с подтверждением email (опционально)
        try:
            verification_token = SecurityUtils.generate_reset_token()
            # Сохраняем токен подтверждения в базе (можно добавить поле в модель User)
            await send_verification_email(user.email, verification_token, user.full_name)
            logger.info(f"Verification email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            # Не прерываем регистрацию, если не удалось отправить email

        # Возвращаем пользователя
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

        try:
            if oauth_data.provider == "google":
                # Получение токена из кода авторизации и проверка
                if oauth_data.redirect_uri:
                    token_data = await GoogleOAuth.get_token_from_code(
                        oauth_data.token,
                        oauth_data.redirect_uri
                    )
                    user_info = token_data["user_info"]
                else:
                    # Используем переданный ID token напрямую
                    user_info = await GoogleOAuth.verify_token(oauth_data.token)

            elif oauth_data.provider == "microsoft":
                # Получение токена из кода авторизации и проверка
                token_data = await MicrosoftOAuth.get_token_from_code(
                    oauth_data.token,
                    oauth_data.redirect_uri
                )
                user_info = token_data["user_info"]

                # Получаем и сохраняем фото профиля, если оно доступно
                if "access_token" in token_data:
                    profile_photo = await MicrosoftOAuth.get_profile_photo(token_data["access_token"])
                    if profile_photo:
                        # Сохраняем фото профиля во временный файл
                        photo_url = await AuthService._save_profile_photo(profile_photo, user_info["sub"])
                        user_info["picture"] = photo_url

            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid OAuth provider"
                )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to get user info from provider"
            )

        # Обязательно должен быть email или sub
        if not user_info.get("email") and not user_info.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email or ID not provided by OAuth provider"
            )

        # Ищем пользователя сначала по OAuth ID
        user = None
        if user_info.get("sub"):
            user = db.query(User).filter(
                User.oauth_provider == oauth_data.provider,
                User.oauth_id == user_info["sub"]
            ).first()

        # Затем по email, если пользователь не найден и email предоставлен
        if not user and user_info.get("email"):
            user = db.query(User).filter(User.email == user_info["email"]).first()

        if not user:
            # Создаем нового пользователя
            name = user_info.get("name", "")
            email = user_info.get("email", f"{user_info['sub']}@{oauth_data.provider}.user")

            user = User(
                email=email,
                full_name=name,
                oauth_provider=oauth_data.provider,
                oauth_id=user_info["sub"],
                is_verified=True,  # OAuth пользователи считаются верифицированными
                profile_photo_url=user_info.get("picture")
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Создаем профиль и финансовые данные
            profile_data = ProfileCreate()
            profile = await ProfileService.create_profile(user.id, profile_data, db)

            # Устанавливаем тип подписки
            expires_at = datetime.utcnow() + timedelta(days=365)
            await ProfileService.update_subscription(user.id, SubscriptionTypeEnum.FREE, expires_at, db)

            # Создаем финансовые данные
            financial_data = FinancialDataCreate(
                balance=0.0,
                savings=0.0,
                credit_score=0
            )
            await ProfileService.create_financial_data(profile.id, financial_data, db)

        else:
            # Обновляем данные существующего пользователя
            if not user.oauth_provider:
                user.oauth_provider = oauth_data.provider
                user.oauth_id = user_info["sub"]

            # Обновляем фото профиля, если предоставлено
            if user_info.get("picture") and user.profile_photo_url != user_info["picture"]:
                user.profile_photo_url = user_info["picture"]

            db.commit()

        # Создаем токены
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        refresh_token = SecurityUtils.create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    async def _save_profile_photo(photo_data: bytes, user_identifier: str) -> str:
        """Сохранение фото профиля из OAuth провайдера"""
        # Создаем директорию для хранения фото
        upload_dir = f"{settings.UPLOAD_DIR}/profile_photos"
        os.makedirs(upload_dir, exist_ok=True)

        # Генерируем уникальное имя файла
        unique_filename = f"{uuid.uuid4()}.jpg"
        file_path = f"{upload_dir}/{unique_filename}"

        # Сохраняем файл
        with open(file_path, "wb") as buffer:
            buffer.write(photo_data)

        # Возвращаем относительный путь
        return f"/profile_photos/{unique_filename}"

    @staticmethod
    async def request_password_reset(email: str, db: Session) -> None:
        """Запрос на сброс пароля"""
        logger.info(f"Processing password reset request for email: {email}")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Не раскрываем информацию о существовании пользователя
            # Но все равно логируем попытку
            logger.warning(f"Password reset requested for non-existent email: {email}")
            return

        try:
            # Генерируем токен сброса
            reset_token = SecurityUtils.generate_reset_token()
            user.reset_password_token = reset_token
            user.reset_password_token_expires = datetime.utcnow() + timedelta(
                hours=getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRE_HOURS', 1)
            )

            db.commit()
            logger.info(f"Password reset token generated for user {user.email}")

            # Отправляем email с токеном сброса
            try:
                email_sent = await send_reset_email(user.email, reset_token, user.full_name)
                if email_sent:
                    logger.info(f"Password reset email sent successfully to {user.email}")
                else:
                    logger.error(f"Failed to send password reset email to {user.email}")
                    # В продакшене можно показать пользователю, что возникли проблемы с отправкой
                    # Но не будем бросать исключение, чтобы не раскрывать информацию о пользователе
            except Exception as e:
                logger.error(f"Error sending password reset email to {user.email}: {str(e)}")
                # В продакшене можно добавить retry механизм или уведомление администратора
                
        except Exception as e:
            logger.error(f"Database error during password reset for {email}: {str(e)}")
            # Откатываем изменения в БД
            db.rollback()
            raise

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

        logger.info(f"Password successfully reset for user {user.email}")

    @staticmethod
    async def verify_email(token: str, db: Session) -> None:
        """Подтверждение email адреса"""
        # Здесь нужно реализовать логику проверки токена верификации
        # В текущей реализации токен верификации не сохраняется в БД
        # Можно добавить поля email_verification_token и email_verification_expires в модель User
        
        # Заглушка для примера
        logger.info(f"Email verification requested with token: {token}")
        # TODO: Implement email verification logic
        pass