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
    OAuthLoginRequest,
    OAuthInitRequest
)
from app.schemas.user import UserCreate, UserResponse
from app.services.auth import AuthService
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.config import settings
import urllib.parse
import logging

# Настраиваем логгер
logger = logging.getLogger(__name__)

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
    try:
        user = await AuthService.register_user(user_data, db)
        return user
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Вход пользователя"""
    try:
        token = await AuthService.login_user(
            login_data.email,
            login_data.password,
            db
        )
        return token
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Обновление токенов"""
    try:
        token = await AuthService.refresh_token(token_data.refresh_token, db)
        return token
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise


@router.post("/oauth/init")
async def oauth_init(
        oauth_data: OAuthInitRequest
):
    """Инициация OAuth процесса"""
    try:
        if oauth_data.provider == "google":
            if not settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google OAuth not configured"
                )

            # Генерация URL для Google OAuth
            params = {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'redirect_uri': oauth_data.redirect_uri,
                'response_type': 'code',
                'scope': 'email profile',
                'access_type': 'offline',
                'prompt': 'consent'
            }

            auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
            return {"auth_url": auth_url}

        elif oauth_data.provider == "microsoft":
            if not settings.MICROSOFT_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Microsoft OAuth not configured"
                )

            # Генерация URL для Microsoft OAuth
            params = {
                'client_id': settings.MICROSOFT_CLIENT_ID,
                'redirect_uri': oauth_data.redirect_uri,
                'response_type': 'code',
                'scope': 'openid profile email User.Read',
                'response_mode': 'query'
            }

            auth_url = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT}/oauth2/v2.0/authorize?{urllib.parse.urlencode(params)}"
            return {"auth_url": auth_url}

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth provider"
            )
    except Exception as e:
        logger.error(f"OAuth init error: {str(e)}")
        raise


@router.post("/oauth/login", response_model=Token)
async def oauth_login(
        oauth_data: OAuthLoginRequest,
        db: Session = Depends(get_db)
):
    """OAuth вход/регистрация"""
    try:
        token = await AuthService.oauth_login(oauth_data, db)
        return token
    except Exception as e:
        logger.error(f"OAuth login error: {str(e)}")
        raise


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
    try:
        logger.info(f"Password reset requested for email: {reset_data.email}")
        await AuthService.request_password_reset(reset_data.email, db)
        return {"message": "Password reset instructions sent to email"}
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}", exc_info=True)
        # В продакшене не раскрываем детали ошибки
        return {"message": "Password reset instructions sent to email"}


@router.post("/password-reset/confirm")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Подтверждение сброса пароля"""
    try:
        await AuthService.reset_password(
            reset_data.token,
            reset_data.new_password,
            db
        )
        return {"message": "Password successfully reset"}
    except Exception as e:
        logger.error(f"Password reset confirm error: {str(e)}")
        raise


@router.post("/test-email")
async def test_email_sending(
    email: str,
    db: Session = Depends(get_db)
):
    """Тестовый эндпоинт для проверки отправки email (только для разработки)"""
    try:
        from app.utils.mailer import send_reset_email
        
        logger.info(f"Testing email sending to: {email}")
        
        # Тестируем отправку письма для сброса пароля
        test_token = "TEST_TOKEN_123456"
        success = await send_reset_email(email, test_token, "Test User")
        
        if success:
            logger.info(f"Test email sent successfully to {email}")
            return {
                "message": "Test email sent successfully",
                "email": email,
                "status": "success"
            }
        else:
            logger.error(f"Failed to send test email to {email}")
            return {
                "message": "Failed to send test email",
                "email": email,
                "status": "failed",
                "error": "Email sending failed"
            }
            
    except Exception as e:
        logger.error(f"Error sending test email to {email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending test email: {str(e)}"
        )