# app/services/user.py
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserUpdate, UserPersonalInfo
from app.utils.security import SecurityUtils
from datetime import datetime


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
    async def verify_email(token: str, db: Session) -> None:
        """Подтвердить email пользователя"""
        # Здесь должна быть логика проверки токена верификации
        pass

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

        # Проверяем текущий пароль
        if not SecurityUtils.verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Валидация нового пароля
        is_strong, message = SecurityUtils.password_strength_validator(new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        # Проверяем, что новый пароль отличается от текущего
        if SecurityUtils.verify_password(new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )

        # Обновляем пароль
        user.hashed_password = SecurityUtils.get_password_hash(new_password)
        db.commit()