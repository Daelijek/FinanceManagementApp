# app/models/notification.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class NotificationTypeEnum(str, enum.Enum):
    LARGE_TRANSACTION = "large_transaction"
    UPCOMING_BILL = "upcoming_bill"
    NEW_DEVICE_LOGIN = "new_device_login"
    BUDGET_GOAL_ACHIEVED = "budget_goal_achieved"
    WEEKLY_SUMMARY = "weekly_summary"
    SECURITY_ALERT = "security_alert"
    SUBSCRIPTION_RENEWAL = "subscription_renewal"


class NotificationCategoryEnum(str, enum.Enum):
    ALL = "all"
    TRANSACTIONS = "transactions"
    BILLS = "bills"
    SECURITY = "security"
    BUDGET = "budget"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Основная информация
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationTypeEnum), nullable=False)
    category = Column(Enum(NotificationCategoryEnum), nullable=False)
    icon = Column(String, nullable=True)

    # Метаданные
    is_read = Column(Boolean, default=False)
    is_actionable = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)  # URL или deep link для действия

    # Связанные данные (опционально)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    user = relationship("User", backref="notifications")
    transaction = relationship("Transaction", backref="notifications")

    @property
    def relative_time(self):
        """Получить относительное время в формате '2 hours ago'"""
        # Эта логика будет реализована в схеме
        return None