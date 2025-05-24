# app/schemas/transaction.py
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.category import CategoryTypeEnum
from app.models.transaction import PaymentMethodEnum


class TransactionBase(BaseModel):
    amount: float
    transaction_type: CategoryTypeEnum
    description: Optional[str] = None
    transaction_date: datetime
    category_id: Optional[int] = None
    payment_method: Optional[PaymentMethodEnum] = None
    is_recurring: bool = False
    note: Optional[str] = None


class TransactionCreate(TransactionBase):
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    transaction_type: Optional[CategoryTypeEnum] = None
    description: Optional[str] = None
    transaction_date: Optional[datetime] = None
    category_id: Optional[int] = None
    payment_method: Optional[PaymentMethodEnum] = None
    is_recurring: Optional[bool] = None
    note: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    receipt_photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionWithCategory(TransactionResponse):
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionSummary(BaseModel):
    total_income: float = 0.0
    total_expense: float = 0.0
    net_balance: float = 0.0


class TransactionFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    transaction_type: Optional[CategoryTypeEnum] = None
    category_ids: Optional[List[int]] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    payment_method: Optional[PaymentMethodEnum] = None


class TransactionListResponse(BaseModel):
    transactions: List[TransactionWithCategory]
    summary: TransactionSummary


class ReceiptPhotoUpload(BaseModel):
    transaction_id: int
    photo_url: str