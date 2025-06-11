# app/services/user.py
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from app.models.user import User
from app.schemas.user import UserUpdate, UserPersonalInfo
from app.utils.security import SecurityUtils
from app.utils.mailer import send_verification_email
from datetime import datetime, timedelta
import os
import uuid
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class UserService:
    @staticmethod
    async def get_user_by_id(user_id: int, db: Session) -> Optional[User]:
        """Получить пользователя по ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    async def get_user_by_email(email: str, db: Session) -> Optional[User]:
        """Получить пользователя по email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    async def get_personal_info(user_id: int, db: Session) -> UserPersonalInfo:
        """Получить персональную информацию пользователя"""
        user = await UserService.get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserPersonalInfo(
            full_name=user.full_name,
            email=user.email,
            phone_number=user.phone_number,
            date_of_birth=user.date_of_birth,
            address=user.address,
            tax_residence=user.tax_residence
        )

    @staticmethod
    async def update_user(user_id: int, user_update: UserUpdate, db: Session) -> User:
        """Обновить данные пользователя"""
        user = await UserService.get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Обновляем только переданные поля
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        # Обновляем время изменения
        user.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    async def upload_profile_photo(user_id: int, file: UploadFile, db: Session) -> str:
        """Загрузка фото профиля пользователя"""
        user = await UserService.get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Директория для хранения файлов
        upload_dir = f"{settings.UPLOAD_DIR}/profile_photos/{user_id}"
        os.makedirs(upload_dir, exist_ok=True)

        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = f"{upload_dir}/{unique_filename}"

        # Сохраняем файл
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Относительный путь для сохранения в БД
        relative_path = f"/profile_photos/{user_id}/{unique_filename}"

        # Обновляем URL фото пользователя
        user.profile_photo_url = relative_path
        db.commit()

        return relative_path

    @staticmethod
    async def delete_user(user_id: int, db: Session) -> None:
        """Удалить пользователя"""
        user = await UserService.get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Мягкое удаление - деактивация аккаунта
        user.is_active = False
        db.commit()

    @staticmethod
    async def send_verification_email(user_id: int, db: Session) -> bool:
        """Отправить письмо для подтверждения email"""
        user = await UserService.get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )

        # Генерируем токен верификации
        verification_token = SecurityUtils.generate_reset_token()
        user.email_verification_token = verification_token
        user.email_verification_token_expires = datetime.utcnow() + timedelta(hours=24)  # 24 часа

        db.commit()

        # Отправляем email
        try:
            email_sent = await send_verification_email(user.email, verification_token, user.full_name)
            if email_sent:
                logger.info(f"Verification email sent successfully to {user.email}")
                return True
            else:
                logger.error(f"Failed to send verification email to {user.email}")
                return False
        except Exception as e:
            logger.error(f"Error sending verification email to {user.email}: {str(e)}")
            return False

    @staticmethod
    async def verify_email(token: str, db: Session) -> None:
        """Подтвердить email пользователя"""
        user = db.query(User).filter(
            User.email_verification_token == token,
            User.email_verification_token_expires > datetime.utcnow()
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )

        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )

        # Подтверждаем email
        user.is_verified = True
        user.email_verification_token = None
        user.email_verification_token_expires = None

        db.commit()

        logger.info(f"Email successfully verified for user {user.email}")

    @staticmethod
    async def change_password(
            user_id: int,
            current_password: str,
            new_password: str,
            db: Session
    ) -> None:
        """Изменить пароль пользователя"""
        user = await UserService.get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Проверяем текущий пароль (только для не-OAuth пользователей)
        if user.hashed_password:
            if not SecurityUtils.verify_password(current_password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
        else:
            # Если пользователь OAuth и у него нет пароля, не требуем текущий пароль
            pass

        # Валидация нового пароля
        is_strong, message = SecurityUtils.password_strength_validator(new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        # Проверяем, что новый пароль отличается от текущего (если есть)
        if user.hashed_password and SecurityUtils.verify_password(new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )

        # Обновляем пароль
        user.hashed_password = SecurityUtils.get_password_hash(new_password)
        db.commit()

        logger.info(f"Password successfully changed for user {user.email}")

    @staticmethod
    async def resend_verification_email(user_id: int, db: Session) -> bool:
        """Повторно отправить письмо для подтверждения email"""
        return await UserService.send_verification_email(user_id, db)