# app/services/profile.py
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.financial import UserProfile, FinancialData, BankAccount, SubscriptionTypeEnum
from app.schemas.profile import ProfileCreate, ProfileUpdate, FinancialDataCreate, FinancialDataUpdate, \
    BankAccountCreate, BankAccountUpdate
from app.services.pydantic_helpers import model_to_dict


class ProfileService:
    @staticmethod
    async def create_profile(user_id: int, profile_data: Optional[ProfileCreate], db: Session) -> UserProfile:
        """Создание профиля пользователя"""
        # Проверяем, существует ли пользователь
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Проверяем, существует ли уже профиль
        existing_profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists for this user"
            )

        # Создаем профиль с данными или по умолчанию
        if profile_data:
            profile = UserProfile(
                user_id=user_id,
                **model_to_dict(profile_data)
            )
        else:
            profile = UserProfile(user_id=user_id)

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    @staticmethod
    async def get_profile(user_id: int, db: Session) -> Optional[UserProfile]:
        """Получение профиля пользователя"""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            return None

        return profile

    @staticmethod
    async def update_profile(user_id: int, profile_data: ProfileUpdate, db: Session) -> UserProfile:
        """Обновление профиля пользователя"""
        profile = await ProfileService.get_profile(user_id, db)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        # Обновляем только переданные поля
        update_data = model_to_dict(profile_data, exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    async def update_subscription(user_id: int, subscription_type: SubscriptionTypeEnum, expires_at,
                                  db: Session) -> UserProfile:
        """Обновление типа подписки пользователя"""
        profile = await ProfileService.get_profile(user_id, db)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        profile.subscription_type = subscription_type
        profile.subscription_expires = expires_at

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    async def create_financial_data(profile_id: int, financial_data: FinancialDataCreate, db: Session) -> FinancialData:
        """Создание финансовых данных для профиля"""
        # Проверяем существование профиля
        profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        # Проверяем, существуют ли уже финансовые данные
        existing_data = db.query(FinancialData).filter(FinancialData.profile_id == profile_id).first()
        if existing_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Financial data already exists for this profile"
            )

        # Создаем финансовые данные
        data = FinancialData(
            profile_id=profile_id,
            **model_to_dict(financial_data)
        )

        db.add(data)
        db.commit()
        db.refresh(data)

        return data

    @staticmethod
    async def get_financial_data(profile_id: int, db: Session) -> Optional[FinancialData]:
        """Получение финансовых данных"""
        financial_data = db.query(FinancialData).filter(FinancialData.profile_id == profile_id).first()
        return financial_data

    @staticmethod
    async def update_financial_data(profile_id: int, financial_data: FinancialDataUpdate, db: Session) -> FinancialData:
        """Обновление финансовых данных"""
        data = await ProfileService.get_financial_data(profile_id, db)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial data not found"
            )

        # Обновляем только переданные поля
        update_data = model_to_dict(financial_data, exclude_unset=True)
        for field, value in update_data.items():
            setattr(data, field, value)

        db.commit()
        db.refresh(data)
        return data

    @staticmethod
    async def get_bank_accounts(financial_data_id: int, db: Session) -> List[BankAccount]:
        """Получение списка банковских счетов"""
        accounts = db.query(BankAccount).filter(BankAccount.financial_data_id == financial_data_id).all()
        return accounts

    @staticmethod
    async def create_bank_account(financial_data_id: int, account_data: BankAccountCreate, db: Session) -> BankAccount:
        """Создание банковского счета"""
        # Проверяем существование финансовых данных
        financial_data = db.query(FinancialData).filter(FinancialData.id == financial_data_id).first()
        if not financial_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial data not found"
            )

        # Если новый счет помечен как основной, сбрасываем признак у остальных счетов
        if account_data.is_primary:
            db.query(BankAccount).filter(
                BankAccount.financial_data_id == financial_data_id,
                BankAccount.is_primary == True
            ).update({"is_primary": False})

        # Создаем счет
        account = BankAccount(
            financial_data_id=financial_data_id,
            **model_to_dict(account_data)
        )

        db.add(account)
        db.commit()
        db.refresh(account)

        return account

    @staticmethod
    async def update_bank_account(account_id: int, account_data: BankAccountUpdate, db: Session) -> BankAccount:
        """Обновление банковского счета"""
        account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank account not found"
            )

        # Если счет помечается как основной, сбрасываем признак у остальных счетов
        if account_data.is_primary:
            db.query(BankAccount).filter(
                BankAccount.financial_data_id == account.financial_data_id,
                BankAccount.id != account_id,
                BankAccount.is_primary == True
            ).update({"is_primary": False})

        # Обновляем только переданные поля
        update_data = model_to_dict(account_data, exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)

        db.commit()
        db.refresh(account)
        return account

    @staticmethod
    async def delete_bank_account(account_id: int, db: Session) -> None:
        """Удаление банковского счета"""
        account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank account not found"
            )

        db.delete(account)
        db.commit()