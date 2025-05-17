# app/schemas/profile.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.financial import CurrencyEnum, LanguageEnum, SubscriptionTypeEnum


# Схемы для профиля пользователя
class ProfileBase(BaseModel):
    preferred_currency: Optional[CurrencyEnum] = CurrencyEnum.USD
    preferred_language: Optional[LanguageEnum] = LanguageEnum.EN
    email_notifications: Optional[bool] = True
    push_notifications: Optional[bool] = True
    transaction_alerts: Optional[bool] = True


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    subscription_type: SubscriptionTypeEnum
    subscription_expires: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для финансовых данных
class FinancialDataBase(BaseModel):
    balance: float
    savings: float
    credit_score: int


class FinancialDataCreate(FinancialDataBase):
    pass


class FinancialDataUpdate(BaseModel):
    balance: Optional[float] = None
    savings: Optional[float] = None
    credit_score: Optional[int] = None


class FinancialDataResponse(FinancialDataBase):
    id: int
    profile_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для банковских счетов
class BankAccountBase(BaseModel):
    account_name: str
    account_number: str
    bank_name: str
    account_type: str
    is_primary: Optional[bool] = False


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    is_primary: Optional[bool] = None


class BankAccountResponse(BankAccountBase):
    id: int
    financial_data_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Комбинированные схемы для профиля
class ProfileWithFinancialData(ProfileResponse):
    financial_data: Optional[FinancialDataResponse] = None

    class Config:
        from_attributes = True


class FullProfileResponse(ProfileWithFinancialData):
    bank_accounts: List[BankAccountResponse] = []

    class Config:
        from_attributes = True