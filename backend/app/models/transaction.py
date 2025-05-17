# app/models/transaction.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Transaction(Base):
    """Модель транзакции для тестов"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("budget_categories.id"), nullable=True)

    # Основная информация
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_income = Column(Boolean, default=False)
    transaction_date = Column(DateTime(timezone=True), nullable=False)

    # Связи
    user = relationship("User", backref="transactions")
    category = relationship("BudgetCategory", backref="transactions")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())