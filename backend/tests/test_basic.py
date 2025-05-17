# tests/test_basic.py
"""
Базовые тесты для проверки работы тестовой инфраструктуры
"""
from sqlalchemy import text


def test_db_works(db):
    """Проверяет, что фикстура db работает корректно"""
    # Просто проверяем, что сессия с БД успешно создана
    assert db is not None
    # Проверяем, что можем выполнять запросы
    result = db.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_client_works(client):
    """Проверяет, что клиент API работает корректно"""
    # Проверяем основной эндпоинт
    response = client.get("/")
    assert response.status_code == 200

    # Проверяем health check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"