# app/api/v1/settings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.financial import CurrencyEnum, LanguageEnum
from app.utils.dependencies import get_current_active_user
from app.services.profile import ProfileService
from app.schemas.profile import ProfileUpdate

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


@router.get("/currency")
async def get_available_currencies():
    """Получить список доступных валют"""
    return [{"code": currency.value, "name": get_currency_name(currency)} for currency in CurrencyEnum]


@router.put("/currency/{currency_code}")
async def update_currency(
        currency_code: CurrencyEnum,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить предпочитаемую валюту пользователя"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        profile = await ProfileService.create_profile(current_user.id, None, db)

    # Обновляем валюту
    profile_update = ProfileUpdate(preferred_currency=currency_code)
    await ProfileService.update_profile(current_user.id, profile_update, db)

    return {"message": f"Currency updated to {currency_code.value}"}


@router.get("/language")
async def get_available_languages():
    """Получить список доступных языков"""
    return [{"code": lang.value, "name": lang.value} for lang in LanguageEnum]


@router.put("/language/{language_code}")
async def update_language(
        language_code: LanguageEnum,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить предпочитаемый язык пользователя"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        profile = await ProfileService.create_profile(current_user.id, None, db)

    # Обновляем язык
    profile_update = ProfileUpdate(preferred_language=language_code)
    await ProfileService.update_profile(current_user.id, profile_update, db)

    return {"message": f"Language updated to {language_code.value}"}


@router.put("/notifications")
async def update_notifications(
        email_notifications: bool = True,
        push_notifications: bool = True,
        transaction_alerts: bool = True,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить настройки уведомлений"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        profile = await ProfileService.create_profile(current_user.id, None, db)

    # Обновляем настройки уведомлений
    profile_update = ProfileUpdate(
        email_notifications=email_notifications,
        push_notifications=push_notifications,
        transaction_alerts=transaction_alerts
    )
    await ProfileService.update_profile(current_user.id, profile_update, db)

    return {
        "message": "Notification settings updated",
        "settings": {
            "email_notifications": email_notifications,
            "push_notifications": push_notifications,
            "transaction_alerts": transaction_alerts
        }
    }


# Вспомогательная функция для получения названия валюты
def get_currency_name(currency: CurrencyEnum) -> str:
    currency_names = {
        CurrencyEnum.USD: "US Dollar",
        CurrencyEnum.EUR: "Euro",
        CurrencyEnum.RUB: "Russian Ruble",
        CurrencyEnum.KZT: "Kazakhstani Tenge",
        CurrencyEnum.GBP: "British Pound"
    }
    return currency_names.get(currency, currency.value)