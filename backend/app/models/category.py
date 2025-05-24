# app/models/category.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class CategoryTypeEnum(str, enum.Enum):
    EXPENSE = "expense"
    INCOME = "income"


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Информация о категории
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Имя или ключ иконки
    color = Column(String, nullable=True)  # Цвет категории (hex-код)
    category_type = Column(Enum(CategoryTypeEnum), nullable=False, default=CategoryTypeEnum.EXPENSE)
    is_system = Column(Boolean, default=False)  # Системная категория (неудаляемая)
    position = Column(Integer, default=0)  # Позиция для сортировки категорий

    # Связи
    user = relationship("User", backref="budget_categories", foreign_keys=[user_id])
    transactions = relationship("Transaction", back_populates="category")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())