# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserProfile, UserUpdate, UserPersonalInfo
from app.utils.dependencies import get_current_active_user, get_current_verified_user
from app.models.user import User
from app.services.user import UserService
from typing import Optional

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


@router.post("/resend-verification")
async def resend_verification_email(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Повторно отправить письмо для подтверждения email"""
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )

    email_sent = await UserService.resend_verification_email(current_user.id, db)
    if email_sent:
        return {"message": "Verification email sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )


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


# Новые эндпоинты для персональной информации
@router.get("/me/personal", response_model=UserPersonalInfo)
async def get_personal_info(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить персональную информацию пользователя"""
    return await UserService.get_personal_info(current_user.id, db)


@router.put("/me/personal", response_model=UserPersonalInfo)
async def update_personal_info(
        user_info: UserUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить персональную информацию пользователя"""
    updated_user = await UserService.update_user(current_user.id, user_info, db)
    return UserPersonalInfo(
        full_name=updated_user.full_name,
        email=updated_user.email,
        phone_number=updated_user.phone_number,
        date_of_birth=updated_user.date_of_birth,
        address=updated_user.address,
        tax_residence=updated_user.tax_residence
    )


@router.post("/me/photo")
async def upload_profile_photo(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Загрузить фото профиля"""
    # Проверяем тип файла
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    # Проверяем размер файла (макс 5 МБ)
    file_size = len(await file.read())
    await file.seek(0)  # Возвращаем указатель в начало
    
    if file_size > 5 * 1024 * 1024:  # 5 МБ
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5 MB"
        )

    photo_url = await UserService.upload_profile_photo(current_user.id, file, db)
    return {"message": "Photo uploaded successfully", "photo_url": photo_url}


@router.get("/me/verification-status")
async def get_verification_status(
        current_user: User = Depends(get_current_active_user)
):
    """Получить статус верификации пользователя"""
    return {
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "verification_required": not current_user.is_verified
    }