# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    Token,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    OAuthLoginRequest
)
from app.schemas.user import UserCreate, UserResponse
from app.services.auth import AuthService
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Регистрация нового пользователя"""
    user = await AuthService.register_user(user_data, db)
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Вход пользователя"""
    token = await AuthService.login_user(
        login_data.email,
        login_data.password,
        db
    )
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Обновление токенов"""
    token = await AuthService.refresh_token(token_data.refresh_token, db)
    return token


@router.post("/oauth/login", response_model=Token)
async def oauth_login(
    oauth_data: OAuthLoginRequest,
    db: Session = Depends(get_db)
):
    """OAuth вход/регистрация"""
    token = await AuthService.oauth_login(oauth_data, db)
    return token


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Выход пользователя"""
    # В простой реализации просто возвращаем успех
    # В продакшене можно добавить blacklist токенов
    return {"message": "Successfully logged out"}


@router.post("/password-reset/request")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Запрос на сброс пароля"""
    await AuthService.request_password_reset(reset_data.email, db)
    return {"message": "Password reset instructions sent to email"}


@router.post("/password-reset/confirm")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Подтверждение сброса пароля"""
    await AuthService.reset_password(
        reset_data.token,
        reset_data.new_password,
        db
    )
    return {"message": "Password successfully reset"}

