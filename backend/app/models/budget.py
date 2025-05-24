# app/models/budget.py (обновленная версия)
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Float, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import date


class BudgetPeriodEnum(str, enum.Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    YEARLY = "yearly"


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("budget_categories.id"), nullable=False)

    # Настройки бюджета
    amount = Column(Float, nullable=False)  # Запланированная сумма
    period = Column(String, nullable=False, default=BudgetPeriodEnum.MONTHLY)  # Период бюджета

    # Временные рамки
    start_date = Column(Date, nullable=False)  # Начало периода
    end_date = Column(Date, nullable=False)  # Конец периода

    # Статус
    is_active = Column(Boolean, default=True)

    # Связи
    user = relationship("User", backref="budgets")
    category = relationship("BudgetCategory", backref="budgets")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def calculate_spent_amount(self, db_session):
        """Рассчет потраченной суммы (требует сессию БД)"""
        from app.models.transaction import Transaction
        from app.models.category import CategoryTypeEnum

        spent = db_session.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == self.user_id,
            Transaction.category_id == self.category_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= self.start_date,
            Transaction.transaction_date <= self.end_date
        ).scalar()

        return spent or 0.0

    def get_remaining_amount(self, spent_amount: float = None):
        """Оставшаяся сумма"""
        if spent_amount is None:
            return self.amount  # Если не передана потраченная сумма, возвращаем полную
        return max(0, self.amount - spent_amount)

    def get_usage_percentage(self, spent_amount: float = None):
        """Процент использования бюджета"""
        if spent_amount is None:
            return 0.0  # Если не передана потраченная сумма, возвращаем 0
        if self.amount == 0:
            return 0.0
        return min(100, (spent_amount / self.amount) * 100)