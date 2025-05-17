# app/models/category.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.database import Base


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Информация о категории
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Имя или ключ иконки
    color = Column(String, nullable=True)  # Цвет категории (hex-код)
    is_income = Column(Boolean, default=False)  # Категория доходов или расходов
    is_system = Column(Boolean, default=False)  # Системная категория (неудаляемая)
    parent_id = Column(Integer, ForeignKey("budget_categories.id"), nullable=True)  # Для подкатегорий

    # Связи
    user = relationship("User", backref="budget_categories", foreign_keys=[user_id])
    subcategories = relationship("BudgetCategory", backref=backref("parent", remote_side=[id]),
                                 foreign_keys=[parent_id])

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())