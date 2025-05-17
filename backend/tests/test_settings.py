# tests/test_settings.py
import pytest
from app.models.financial import CurrencyEnum, LanguageEnum


def test_get_available_currencies(authorized_client):
    """Тест получения списка доступных валют"""
    response = authorized_client.get("/api/v1/settings/currency")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    # Проверяем формат данных
    for currency in data:
        assert "code" in currency
        assert "name" in currency


@pytest.mark.skip("Требуется обновление тестов для поддержки Pydantic v2")
def test_update_currency(authorized_client, test_profile):
    """Тест обновления предпочитаемой валюты"""
    # В зависимости от реализации, может быть строка или Enum
    currency = "EUR"

    response = authorized_client.put(f"/api/v1/settings/currency/{currency}")

    assert response.status_code == 200
    assert "message" in response.json()

    # Проверяем, что валюта действительно обновилась
    profile_response = authorized_client.get("/api/v1/profile/")
    assert profile_response.status_code == 200
    assert profile_response.json()["preferred_currency"] == currency


def test_get_available_languages(authorized_client):
    """Тест получения списка доступных языков"""
    response = authorized_client.get("/api/v1/settings/language")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    # Проверяем формат данных
    for language in data:
        assert "code" in language
        assert "name" in language


@pytest.mark.skip("Требуется обновление тестов для поддержки Pydantic v2")
def test_update_language(authorized_client, test_profile):
    """Тест обновления предпочитаемого языка"""
    # В зависимости от реализации, может быть строка или Enum
    language = "Spanish"

    response = authorized_client.put(f"/api/v1/settings/language/{language}")

    assert response.status_code == 200
    assert "message" in response.json()

    # Проверяем, что язык действительно обновился
    profile_response = authorized_client.get("/api/v1/profile/")
    assert profile_response.status_code == 200
    assert profile_response.json()["preferred_language"] == language


def test_update_notifications(authorized_client, test_profile):
    """Тест обновления настроек уведомлений"""
    update_data = {
        "email_notifications": False,
        "push_notifications": True,
        "transaction_alerts": False
    }

    response = authorized_client.put("/api/v1/settings/notifications", params=update_data)

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "settings" in data

    # Проверяем обновленные настройки
    settings = data["settings"]
    assert settings["email_notifications"] == update_data["email_notifications"]
    assert settings["push_notifications"] == update_data["push_notifications"]
    assert settings["transaction_alerts"] == update_data["transaction_alerts"]

    # Проверяем, что настройки действительно обновились в профиле
    profile_response = authorized_client.get("/api/v1/profile/")
    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    assert profile_data["email_notifications"] == update_data["email_notifications"]
    assert profile_data["push_notifications"] == update_data["push_notifications"]
    assert profile_data["transaction_alerts"] == update_data["transaction_alerts"]