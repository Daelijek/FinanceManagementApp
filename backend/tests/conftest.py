# tests/conftest.py
import pytest
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Добавляем путь к корневой директории проекта
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Устанавливаем переменные окружения для тестов
os.environ['DATABASE_URL'] = "sqlite:///:memory:"
os.environ['SECRET_KEY'] = "test-secret-key-for-testing-purposes-only"

# Импортируем только после установки переменных окружения
from app.database import Base, get_db
from app.main import app
from app.utils.security import SecurityUtils
from app.models.user import User
from app.models.financial import UserProfile, FinancialData, SubscriptionTypeEnum
# Импортируем все модели, чтобы они были доступны для создания таблиц
from app.models import *

# Создаем тестовую базу данных в памяти
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Создаем тестовую сессию
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем таблицы перед запуском тестов
Base.metadata.create_all(bind=engine)


def override_get_db():
    """Переопределение функции get_db для тестов"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Переопределяем зависимость базы данных для тестов
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db():
    """Фикстура для тестовой базы данных"""
    # Очищаем все существующие данные из таблиц перед каждым тестом
    connection = engine.connect()
    transaction = connection.begin()

    try:
        # Создаем сессию с привязкой к транзакции
        db = TestingSessionLocal(bind=connection)

        # Очищаем все таблицы
        tables = Base.metadata.sorted_tables
        for table in tables:
            db.execute(text(f"DELETE FROM {table.name}"))

        db.commit()

        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def client():
    """Фикстура для тестового клиента"""
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="function")
def test_user(db):
    """Фикстура для создания тестового пользователя"""
    # Создаем тестового пользователя
    hashed_password = SecurityUtils.get_password_hash("password123")
    user = User(
        email="testuser@example.com",
        full_name="Test User",
        hashed_password=hashed_password,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@pytest.fixture(scope="function")
def test_profile(db, test_user):
    """Фикстура для создания тестового профиля"""
    # Проверяем, существует ли уже профиль для пользователя
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == test_user.id).first()
    if existing_profile:
        return existing_profile

    # Создаем профиль
    profile = UserProfile(
        user_id=test_user.id,
        preferred_currency="USD",
        preferred_language="English",
        subscription_type=SubscriptionTypeEnum.FREE,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Создаем финансовые данные
    financial_data = FinancialData(
        profile_id=profile.id,
        balance=1000.0,
        savings=500.0,
        credit_score=750
    )
    db.add(financial_data)
    db.commit()
    db.refresh(financial_data)

    return profile


@pytest.fixture(scope="function")
def token(client, test_user):
    """Фикстура для получения JWT токена"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "password123"}
    )

    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def authorized_client(client, token):
    """Фикстура для авторизованного клиента"""
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {token}"
    }
    return client