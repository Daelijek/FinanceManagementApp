# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserProfile, UserUpdate
from app.utils.dependencies import get_current_active_user, get_current_verified_user
from app.models.user import User
from app.services.user import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Получить профиль текущего пользователя"""
    return current_user


@router.put("/me", response_model=UserProfile)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновить профиль текущего пользователя"""
    updated_user = await UserService.update_user(current_user.id, user_update, db)
    return updated_user


@router.delete("/me")
async def delete_current_user(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """Удалить аккаунт текущего пользователя"""
    await UserService.delete_user(current_user.id, db)
    return {"message": "Account successfully deleted"}


@router.post("/verify-email")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Подтвердить email адрес"""
    await UserService.verify_email(token, db)
    return {"message": "Email successfully verified"}


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Изменить пароль"""
    await UserService.change_password(
        current_user.id,
        current_password,
        new_password,
        db
    )
    return {"message": "Password successfully changed"}