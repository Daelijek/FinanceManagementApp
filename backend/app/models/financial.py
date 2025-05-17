# app/models/financial.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class CurrencyEnum(str, enum.Enum):
    USD = "USD"
    EUR = "EUR"
    RUB = "RUB"
    KZT = "KZT"
    GBP = "GBP"


class LanguageEnum(str, enum.Enum):
    EN = "English"
    RU = "Russian"
    KZ = "Kazakh"
    ES = "Spanish"
    DE = "German"


class SubscriptionTypeEnum(str, enum.Enum):
    FREE = "Free Member"
    PREMIUM = "Premium Member"
    BUSINESS = "Business Member"


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Предпочтения
    preferred_currency = Column(Enum(CurrencyEnum), default=CurrencyEnum.USD)
    preferred_language = Column(Enum(LanguageEnum), default=LanguageEnum.EN)

    # Настройки уведомлений
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    transaction_alerts = Column(Boolean, default=True)

    # Тип подписки
    subscription_type = Column(Enum(SubscriptionTypeEnum), default=SubscriptionTypeEnum.FREE)
    subscription_expires = Column(DateTime(timezone=True), nullable=True)

    # Связи с другими таблицами
    user = relationship("User", back_populates="profile")
    financial_data = relationship("FinancialData", back_populates="profile", uselist=False)

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FinancialData(Base):
    __tablename__ = "financial_data"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), unique=True, nullable=False)

    # Финансовые показатели
    balance = Column(Float, default=0.0)
    savings = Column(Float, default=0.0)
    credit_score = Column(Integer, default=0)

    # Связи с другими таблицами
    profile = relationship("UserProfile", back_populates="financial_data")
    accounts = relationship("BankAccount", back_populates="financial_data")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    financial_data_id = Column(Integer, ForeignKey("financial_data.id"), nullable=False)

    # Данные счета
    account_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    bank_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # savings, checking, credit
    is_primary = Column(Boolean, default=False)

    # Связи с другими таблицами
    financial_data = relationship("FinancialData", back_populates="accounts")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())