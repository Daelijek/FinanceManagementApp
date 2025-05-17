# tests/test_integration.py
import pytest


def test_full_registration_and_profile_flow(client, db):
    """Интеграционный тест: полный процесс от регистрации до настройки профиля"""
    # 1. Регистрация пользователя
    register_data = {
        "email": "integration@example.com",
        "full_name": "Integration Test",
        "password": "StrongPass123!",
        "confirm_password": "StrongPass123!"
    }

    register_response = client.post("/api/v1/auth/register", json=register_data)
    assert register_response.status_code == 201

    # 2. Вход в систему
    login_data = {
        "email": "integration@example.com",
        "password": "StrongPass123!"
    }

    login_response = client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    token_data = login_response.json()

    # Устанавливаем токен для авторизованных запросов
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}

    # 3. Проверяем, что профиль создан автоматически
    profile_response = client.get("/api/v1/profile/", headers=headers)
    assert profile_response.status_code == 200

    # 4. Обновляем настройки профиля
    profile_update = {
        "preferred_currency": "EUR",
        "preferred_language": "Spanish"
    }

    update_response = client.put("/api/v1/profile/", json=profile_update, headers=headers)
    assert update_response.status_code == 200
    assert update_response.json()["preferred_currency"] == "EUR"
    assert update_response.json()["preferred_language"] == "Spanish"

    # 5. Добавляем финансовые данные
    financial_data = {
        "balance": 2500.0,
        "savings": 1200.0,
        "credit_score": 720
    }

    financial_response = client.put("/api/v1/profile/financial", json=financial_data, headers=headers)
    assert financial_response.status_code == 200
    assert financial_response.json()["balance"] == financial_data["balance"]

    # 6. Добавляем банковский счет
    account_data = {
        "account_name": "My Checking",
        "account_number": "123456789",
        "bank_name": "Integration Bank",
        "account_type": "checking",
        "is_primary": True
    }

    account_response = client.post("/api/v1/profile/accounts", json=account_data, headers=headers)
    assert account_response.status_code == 201

    # 7. Получаем системные категории
    categories_response = client.get("/api/v1/categories/system", headers=headers)
    assert categories_response.status_code == 200

    # 8. Создаем собственную категорию
    category_data = {
        "name": "Custom Travel",
        "description": "Travel expenses",
        "icon": "airplane",
        "color": "#4287f5",
        "is_income": False
    }

    category_response = client.post("/api/v1/categories/", json=category_data, headers=headers)
    assert category_response.status_code == 201

    # 9. Получаем полный профиль
    full_profile_response = client.get("/api/v1/profile/full", headers=headers)
    assert full_profile_response.status_code == 200

    # Проверяем, что все наши данные там есть
    full_profile = full_profile_response.json()
    assert full_profile["preferred_currency"] == "EUR"
    assert full_profile["preferred_language"] == "Spanish"
    assert full_profile["financial_data"]["balance"] == 2500.0
    assert len(full_profile["bank_accounts"]) == 1
    assert full_profile["bank_accounts"][0]["account_name"] == "My Checking"


def test_auth_token_refresh_flow(client, db):
    """Интеграционный тест: процесс обновления токенов"""
    # 1. Регистрация пользователя
    register_data = {
        "email": "refresh@example.com",
        "full_name": "Refresh Test",
        "password": "StrongPass123!",
        "confirm_password": "StrongPass123!"
    }

    register_response = client.post("/api/v1/auth/register", json=register_data)
    assert register_response.status_code == 201

    # 2. Вход в систему
    login_data = {
        "email": "refresh@example.com",
        "password": "StrongPass123!"
    }

    login_response = client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    token_data = login_response.json()

    # Сохраняем токены
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]

    # 3. Используем access токен для доступа к профилю
    headers = {"Authorization": f"Bearer {access_token}"}
    profile_response = client.get("/api/v1/profile/", headers=headers)
    assert profile_response.status_code == 200

    # 4. Обновляем токены с помощью refresh токена
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    new_token_data = refresh_response.json()

    # Проверяем, что получили новые токены
    assert "access_token" in new_token_data
    assert "refresh_token" in new_token_data
    assert new_token_data["access_token"] != access_token
    assert new_token_data["refresh_token"] != refresh_token

    # 5. Проверяем, что новый access токен работает
    new_headers = {"Authorization": f"Bearer {new_token_data['access_token']}"}
    new_profile_response = client.get("/api/v1/profile/", headers=new_headers)
    assert new_profile_response.status_code == 200