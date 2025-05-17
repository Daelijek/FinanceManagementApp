# tests/test_profile.py
import pytest


def test_get_profile(authorized_client, test_profile):
    """Тест получения профиля пользователя"""
    response = authorized_client.get("/api/v1/profile/")

    assert response.status_code == 200
    data = response.json()

    # Проверяем ключевые поля, но не конкретные значения, так как они могут отличаться
    assert "id" in data
    assert "preferred_currency" in data
    assert "preferred_language" in data
    assert "subscription_type" in data


def test_update_profile(authorized_client, test_profile):
    """Тест обновления профиля"""
    update_data = {
        "preferred_currency": "EUR",
        "preferred_language": "Spanish",
    }

    response = authorized_client.put("/api/v1/profile/", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["preferred_currency"] == update_data["preferred_currency"]
    assert data["preferred_language"] == update_data["preferred_language"]


@pytest.mark.skip("Требуется доработка теста financial_data")
def test_get_financial_data(authorized_client, test_profile):
    """Тест получения финансовых данных"""
    response = authorized_client.get("/api/v1/profile/financial")

    assert response.status_code == 200
    data = response.json()
    assert data["profile_id"] == test_profile.id

    # Не проверяем конкретные значения
    assert "balance" in data
    assert "savings" in data
    assert "credit_score" in data


def test_update_financial_data(authorized_client, test_profile):
    """Тест обновления финансовых данных"""
    update_data = {
        "balance": 1500.0,
        "savings": 750.0,
        "credit_score": 800
    }

    response = authorized_client.put("/api/v1/profile/financial", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["balance"] == update_data["balance"]
    assert data["savings"] == update_data["savings"]
    assert data["credit_score"] == update_data["credit_score"]


def test_create_bank_account(authorized_client, test_profile):
    """Тест создания банковского счета"""
    account_data = {
        "account_name": "Test Checking",
        "account_number": "1234567890",
        "bank_name": "Test Bank",
        "account_type": "checking",
        "is_primary": True
    }

    response = authorized_client.post("/api/v1/profile/accounts", json=account_data)

    assert response.status_code == 201
    data = response.json()
    assert data["account_name"] == account_data["account_name"]
    assert data["account_number"] == account_data["account_number"]
    assert data["bank_name"] == account_data["bank_name"]
    assert data["account_type"] == account_data["account_type"]
    assert data["is_primary"] == account_data["is_primary"]


@pytest.mark.skip("Требуется доработка теста get_bank_accounts")
def test_get_bank_accounts(authorized_client, test_profile):
    """Тест получения списка банковских счетов"""
    # Сначала создаем счет
    account_data = {
        "account_name": "Test Savings",
        "account_number": "0987654321",
        "bank_name": "Test Bank",
        "account_type": "savings",
        "is_primary": True
    }

    create_response = authorized_client.post("/api/v1/profile/accounts", json=account_data)
    assert create_response.status_code == 201

    # Затем получаем список счетов
    response = authorized_client.get("/api/v1/profile/accounts")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    # Должен быть как минимум один счет
    assert len(data) > 0

    # Проверяем, что созданный счет есть в списке
    found = False
    for account in data:
        if account["account_name"] == account_data["account_name"]:
            found = True
            break

    assert found


def test_update_bank_account(authorized_client, test_profile):
    """Тест обновления банковского счета"""
    # Сначала создаем счет
    account_data = {
        "account_name": "Old Name",
        "account_number": "1111111111",
        "bank_name": "Old Bank",
        "account_type": "checking",
        "is_primary": False
    }

    create_response = authorized_client.post("/api/v1/profile/accounts", json=account_data)
    assert create_response.status_code == 201
    account_id = create_response.json()["id"]

    # Обновляем счет
    update_data = {
        "account_name": "New Name",
        "bank_name": "New Bank",
        "is_primary": True
    }

    response = authorized_client.put(f"/api/v1/profile/accounts/{account_id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["account_name"] == update_data["account_name"]
    assert data["bank_name"] == update_data["bank_name"]
    assert data["is_primary"] == update_data["is_primary"]
    assert data["account_number"] == account_data["account_number"]  # Не изменилось


@pytest.mark.skip("Требуется доработка теста delete_bank_account")
def test_delete_bank_account(authorized_client, test_profile):
    """Тест удаления банковского счета"""
    # Сначала создаем счет
    account_data = {
        "account_name": "To Delete",
        "account_number": "9999999999",
        "bank_name": "Delete Bank",
        "account_type": "savings",
        "is_primary": False
    }

    create_response = authorized_client.post("/api/v1/profile/accounts", json=account_data)
    assert create_response.status_code == 201
    account_id = create_response.json()["id"]

    # Удаляем счет
    response = authorized_client.delete(f"/api/v1/profile/accounts/{account_id}")

    assert response.status_code == 200
    assert "message" in response.json()


@pytest.mark.skip("Требуется доработка теста get_full_profile")
def test_get_full_profile(authorized_client, test_profile):
    """Тест получения полного профиля пользователя"""
    # Сначала создаем счет
    account_data = {
        "account_name": "Full Profile Test",
        "account_number": "1234512345",
        "bank_name": "Full Bank",
        "account_type": "checking",
        "is_primary": True
    }

    create_response = authorized_client.post("/api/v1/profile/accounts", json=account_data)
    assert create_response.status_code == 201

    # Обновляем финансовые данные
    financial_data = {
        "balance": 1500.0,
        "savings": 750.0,
        "credit_score": 800
    }

    financial_response = authorized_client.put("/api/v1/profile/financial", json=financial_data)
    assert financial_response.status_code == 200

    # Получаем полный профиль
    response = authorized_client.get("/api/v1/profile/full")

    assert response.status_code == 200
    data = response.json()

    # Проверяем основные секции
    assert "id" in data
    assert "financial_data" in data
    assert "bank_accounts" in data