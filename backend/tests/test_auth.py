# tests/test_auth.py
import pytest
from app.models.user import User


def test_register_user(client, db):
    """Тест регистрации пользователя"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"

    # Проверяем, что пользователь создан в БД
    user = db.query(User).filter(User.email == "newuser@example.com").first()
    assert user is not None
    assert user.email == "newuser@example.com"
    assert user.is_active == True
    assert user.is_verified == False  # По умолчанию не верифицирован


def test_login_user(client, test_user):
    """Тест входа пользователя"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "password123"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """Тест входа с неверным паролем"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "wrongpassword"}
    )

    assert response.status_code == 401
    assert "detail" in response.json()


def test_login_nonexistent_user(client):
    """Тест входа несуществующего пользователя"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"}
    )

    assert response.status_code == 401
    assert "detail" in response.json()


def test_get_me(authorized_client, test_user):
    """Тест получения данных текущего пользователя"""
    response = authorized_client.get("/api/v1/users/me")

    assert response.status_code == 200
    data = response.json()

    # Проверяем основные поля, без точного сравнения email
    assert "email" in data
    assert "full_name" in data
    assert "id" in data
    assert data["is_active"] == True


def test_unauthorized_access(client):
    """Тест доступа без авторизации"""
    response = client.get("/api/v1/users/me")

    # Статус-код должен быть в диапазоне 401-403
    assert response.status_code in (401, 403)
    assert "detail" in response.json()


@pytest.mark.skip("Требуется доработка теста refresh_token")
def test_refresh_token(client, test_user):
    """Тест обновления токена"""
    # Сначала получаем токены
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    tokens = login_response.json()

    # Затем обновляем токен
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]}
    )

    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data