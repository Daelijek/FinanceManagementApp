# app/models/transaction.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.category import CategoryTypeEnum
import enum


class PaymentMethodEnum(str, enum.Enum):
    CASH = "cash"
    CARD = "card"


class Transaction(Base):
    """Модель транзакции"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("budget_categories.id"), nullable=True)

    # Основная информация
    amount = Column(Float, nullable=False)
    transaction_type = Column(Enum(CategoryTypeEnum), nullable=False)
    description = Column(Text, nullable=True)
    transaction_date = Column(DateTime(timezone=True), nullable=False)

    # Дополнительные поля
    payment_method = Column(Enum(PaymentMethodEnum), nullable=True)
    is_recurring = Column(Boolean, default=False)
    receipt_photo_url = Column(String, nullable=True)
    note = Column(Text, nullable=True)

    # Связи
    user = relationship("User", backref="transactions")
    category = relationship("BudgetCategory", backref="transactions")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())