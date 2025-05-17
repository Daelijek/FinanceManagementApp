# app/api/v1/profile.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.profile import (
    ProfileCreate, ProfileUpdate, ProfileResponse, FinancialDataCreate,
    FinancialDataUpdate, FinancialDataResponse, BankAccountCreate,
    BankAccountUpdate, BankAccountResponse, ProfileWithFinancialData,
    FullProfileResponse
)
from app.services.profile import ProfileService
from app.utils.dependencies import get_current_active_user
from app.models.user import User
from app.models.financial import SubscriptionTypeEnum

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.get("/", response_model=ProfileWithFinancialData)
async def get_profile(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить профиль текущего пользователя с финансовыми данными"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)

    # Если профиля нет, создаем его
    if not profile:
        profile = await ProfileService.create_profile(current_user.id, None, db)

    return profile


@router.put("/", response_model=ProfileResponse)
async def update_profile(
        profile_data: ProfileUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить профиль пользователя"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)

    # Если профиля нет, создаем его
    if not profile:
        profile = await ProfileService.create_profile(current_user.id, ProfileCreate(**profile_data.dict()), db)
    else:
        profile = await ProfileService.update_profile(current_user.id, profile_data, db)

    return profile


@router.post("/subscription/{subscription_type}", response_model=ProfileResponse)
async def update_subscription(
        subscription_type: SubscriptionTypeEnum,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить тип подписки пользователя"""
    # Вычисляем дату истечения подписки (например, месяц)
    expires_at = datetime.utcnow() + timedelta(days=30)

    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        # Создаем профиль с указанной подпиской
        profile_data = ProfileCreate()
        profile = await ProfileService.create_profile(current_user.id, profile_data, db)

    # Обновляем подписку
    profile = await ProfileService.update_subscription(current_user.id, subscription_type, expires_at, db)

    return profile


@router.get("/financial", response_model=FinancialDataResponse)
async def get_financial_data(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить финансовые данные пользователя"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Получаем финансовые данные
    financial_data = await ProfileService.get_financial_data(profile.id, db)
    if not financial_data:
        # Если нет финансовых данных, создаем их с дефолтными значениями
        financial_data = await ProfileService.create_financial_data(
            profile.id,
            FinancialDataCreate(balance=0.0, savings=0.0, credit_score=0),
            db
        )

    return financial_data


@router.put("/financial", response_model=FinancialDataResponse)
async def update_financial_data(
        financial_data: FinancialDataUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить финансовые данные пользователя"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Получаем финансовые данные
    existing_data = await ProfileService.get_financial_data(profile.id, db)
    if not existing_data:
        # Если нет финансовых данных, создаем их
        create_data = FinancialDataCreate(
            balance=financial_data.balance or 0.0,
            savings=financial_data.savings or 0.0,
            credit_score=financial_data.credit_score or 0
        )
        return await ProfileService.create_financial_data(profile.id, create_data, db)

    # Обновляем финансовые данные
    return await ProfileService.update_financial_data(profile.id, financial_data, db)


@router.get("/accounts", response_model=List[BankAccountResponse])
async def get_bank_accounts(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить список банковских счетов пользователя"""
    # Получаем профиль и финансовые данные
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    financial_data = await ProfileService.get_financial_data(profile.id, db)
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )

    # Получаем список счетов
    accounts = await ProfileService.get_bank_accounts(financial_data.id, db)
    return accounts


@router.post("/accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_account(
        account_data: BankAccountCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Создать новый банковский счет"""
    # Получаем профиль и финансовые данные
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    financial_data = await ProfileService.get_financial_data(profile.id, db)
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )

    # Создаем банковский счет
    account = await ProfileService.create_bank_account(financial_data.id, account_data, db)
    return account


@router.put("/accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(
        account_id: int,
        account_data: BankAccountUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить банковский счет"""
    # Получаем профиль и финансовые данные для проверки
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    financial_data = await ProfileService.get_financial_data(profile.id, db)
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )

    # Проверяем принадлежность счета пользователю
    accounts = await ProfileService.get_bank_accounts(financial_data.id, db)
    account_ids = [account.id for account in accounts]

    if account_id not in account_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this account is forbidden"
        )

    # Обновляем счет
    account = await ProfileService.update_bank_account(account_id, account_data, db)
    return account


@router.delete("/accounts/{account_id}")
async def delete_bank_account(
        account_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить банковский счет"""
    # Получаем профиль и финансовые данные для проверки
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    financial_data = await ProfileService.get_financial_data(profile.id, db)
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )

    # Проверяем принадлежность счета пользователю
    accounts = await ProfileService.get_bank_accounts(financial_data.id, db)
    account_ids = [account.id for account in accounts]

    if account_id not in account_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this account is forbidden"
        )

    # Удаляем счет
    await ProfileService.delete_bank_account(account_id, db)
    return {"message": "Bank account successfully deleted"}


@router.get("/full", response_model=FullProfileResponse)
async def get_full_profile(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить полный профиль пользователя с финансовыми данными и банковскими счетами"""
    # Получаем профиль
    profile = await ProfileService.get_profile(current_user.id, db)
    if not profile:
        profile = await ProfileService.create_profile(current_user.id, None, db)

    # Получаем финансовые данные
    financial_data = await ProfileService.get_financial_data(profile.id, db)
    if not financial_data:
        # Создаем финансовые данные с дефолтными значениями
        financial_data = await ProfileService.create_financial_data(
            profile.id,
            FinancialDataCreate(balance=0.0, savings=0.0, credit_score=0),
            db
        )

    # Получаем банковские счета
    accounts = await ProfileService.get_bank_accounts(financial_data.id, db)

    # Соединяем все данные в одну модель
    full_profile = FullProfileResponse(
        **profile.__dict__,
        financial_data=financial_data,
        bank_accounts=accounts
    )

    return full_profile