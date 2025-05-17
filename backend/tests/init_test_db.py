# tests/init_test_db.py
"""
Скрипт для инициализации базы данных для тестирования.
Используется для создания тестовых данных в базе данных.
"""

import sys
import os
from datetime import datetime, timedelta

# Добавляем корневую директорию проекта в sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.financial import UserProfile, FinancialData, BankAccount, SubscriptionTypeEnum
from app.models.category import BudgetCategory
from app.utils.security import SecurityUtils


def init_test_db():
    """
    Инициализирует базу данных тестовыми данными.
    Этот скрипт можно запустить отдельно для заполнения базы.
    """
    # Создаем таблицы
    Base.metadata.create_all(bind=engine)

    # Создаем сессию
    db = SessionLocal()

    try:
        # Проверяем, есть ли уже тестовые данные
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if test_user:
            print("Test data already exists. Skipping initialization.")
            return

        print("Initializing test database...")

        # Создаем тестового пользователя
        hashed_password = SecurityUtils.get_password_hash("Test123!")
        user = User(
            email="test@example.com",
            full_name="Test User",
            hashed_password=hashed_password,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Создаем профиль пользователя
        profile = UserProfile(
            user_id=user.id,
            preferred_currency="USD",
            preferred_language="English",
            subscription_type=SubscriptionTypeEnum.PREMIUM,
            subscription_expires=datetime.utcnow() + timedelta(days=30)
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Создаем финансовые данные
        financial_data = FinancialData(
            profile_id=profile.id,
            balance=12580.0,
            savings=2840.0,
            credit_score=785
        )
        db.add(financial_data)
        db.commit()
        db.refresh(financial_data)

        # Создаем банковские счета
        accounts = [
            BankAccount(
                financial_data_id=financial_data.id,
                account_name="Checking Account",
                account_number="1234567890",
                bank_name="Main Bank",
                account_type="checking",
                is_primary=True
            ),
            BankAccount(
                financial_data_id=financial_data.id,
                account_name="Savings Account",
                account_number="0987654321",
                bank_name="Main Bank",
                account_type="savings",
                is_primary=False
            ),
            BankAccount(
                financial_data_id=financial_data.id,
                account_name="Investment Account",
                account_number="5678901234",
                bank_name="Investment Bank",
                account_type="investment",
                is_primary=False
            )
        ]
        db.add_all(accounts)
        db.commit()

        # Создаем категории бюджета
        income_categories = [
            BudgetCategory(user_id=user.id, name="Salary", icon="wallet", color="#4CAF50", is_income=True,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Investments", icon="chart-line", color="#2196F3", is_income=True,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Gifts", icon="gift", color="#9C27B0", is_income=True, is_system=True),
            BudgetCategory(user_id=user.id, name="Side Hustle", icon="briefcase", color="#FF9800", is_income=True,
                           is_system=True),
        ]

        expense_categories = [
            BudgetCategory(user_id=user.id, name="Housing", icon="home", color="#f44336", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Food", icon="restaurant", color="#FF9800", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Transportation", icon="car", color="#2196F3", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Entertainment", icon="movie", color="#9C27B0", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Shopping", icon="shopping-cart", color="#4CAF50", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Health", icon="hospital", color="#607D8B", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Education", icon="school", color="#795548", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user.id, name="Utilities", icon="bolt", color="#FF5722", is_income=False,
                           is_system=True),
        ]

        # Добавляем пользовательские категории
        custom_categories = [
            BudgetCategory(user_id=user.id, name="Travel", icon="airplane", color="#3F51B5", is_income=False),
            BudgetCategory(user_id=user.id, name="Subscriptions", icon="tv", color="#009688", is_income=False),
            BudgetCategory(user_id=user.id, name="Freelance", icon="laptop", color="#673AB7", is_income=True),
        ]

        db.add_all(income_categories + expense_categories + custom_categories)
        db.commit()

        print("Test database initialized successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    init_test_db()