# tests/test_categories.py
import pytest


@pytest.mark.skip("Требуется доработка схемы SystemCategoriesResponse")
def test_get_system_categories(authorized_client):
    """Тест получения системных категорий"""
    response = authorized_client.get("/api/v1/categories/system")

    assert response.status_code == 200
    data = response.json()

    # Проверяем структуру данных
    assert "income_categories" in data
    assert "expense_categories" in data
    assert isinstance(data["income_categories"], list)
    assert isinstance(data["expense_categories"], list)

    # Проверяем, что есть как минимум несколько категорий
    assert len(data["income_categories"]) > 0
    assert len(data["expense_categories"]) > 0

    # Проверяем содержимое категорий
    for category in data["income_categories"] + data["expense_categories"]:
        assert "id" in category
        assert "name" in category
        assert "is_income" in category


def test_create_category(authorized_client):
    """Тест создания новой категории"""
    category_data = {
        "name": "Test Category",
        "description": "This is a test category",
        "icon": "test-icon",
        "color": "#FF5733",
        "is_income": True
    }

    response = authorized_client.post("/api/v1/categories/", json=category_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == category_data["name"]
    assert data["description"] == category_data["description"]
    assert data["icon"] == category_data["icon"]
    assert data["color"] == category_data["color"]
    assert data["is_income"] == category_data["is_income"]
    assert "id" in data
    assert "user_id" in data


def test_get_categories(authorized_client):
    """Тест получения всех категорий пользователя"""
    # Создаем несколько категорий
    for i in range(3):
        category_data = {
            "name": f"Category {i + 1}",
            "description": f"Description {i + 1}",
            "icon": f"icon-{i + 1}",
            "color": f"#00{i + 1}000",
            "is_income": i % 2 == 0  # Чередуем доход/расход
        }
        response = authorized_client.post("/api/v1/categories/", json=category_data)
        assert response.status_code == 201

    # Получаем все категории
    response = authorized_client.get("/api/v1/categories/")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    # Должны быть как минимум те 3 категории, которые мы создали
    assert len(data) >= 3

    # Проверяем структуру данных
    for category in data:
        assert "id" in category
        assert "name" in category
        assert "description" in category
        assert "icon" in category
        assert "color" in category
        assert "is_income" in category
        assert "subcategories" in category


def test_create_subcategory(authorized_client):
    """Тест создания подкатегории"""
    # Создаем родительскую категорию
    parent_data = {
        "name": "Parent Category",
        "description": "Parent description",
        "icon": "parent-icon",
        "color": "#123456",
        "is_income": False
    }

    parent_response = authorized_client.post("/api/v1/categories/", json=parent_data)
    assert parent_response.status_code == 201
    parent_id = parent_response.json()["id"]

    # Создаем подкатегорию
    child_data = {
        "name": "Child Category",
        "description": "Child description",
        "icon": "child-icon",
        "color": "#654321",
        "is_income": False,
        "parent_id": parent_id
    }

    child_response = authorized_client.post("/api/v1/categories/", json=child_data)

    assert child_response.status_code == 201
    child = child_response.json()
    assert child["name"] == child_data["name"]
    assert child["parent_id"] == parent_id

    # Проверяем, что подкатегория появилась в родительской категории
    get_response = authorized_client.get(f"/api/v1/categories/{parent_id}")
    assert get_response.status_code == 200
    parent = get_response.json()
    assert len(parent["subcategories"]) == 1
    assert parent["subcategories"][0]["id"] == child["id"]
    assert parent["subcategories"][0]["name"] == child["name"]


def test_update_category(authorized_client):
    """Тест обновления категории"""
    # Создаем категорию
    category_data = {
        "name": "Original Name",
        "description": "Original description",
        "icon": "original-icon",
        "color": "#AAAAAA",
        "is_income": True
    }

    create_response = authorized_client.post("/api/v1/categories/", json=category_data)
    assert create_response.status_code == 201
    category_id = create_response.json()["id"]

    # Обновляем категорию
    update_data = {
        "name": "Updated Name",
        "description": "Updated description",
        "icon": "updated-icon",
        "color": "#BBBBBB"
    }

    update_response = authorized_client.put(f"/api/v1/categories/{category_id}", json=update_data)

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == update_data["name"]
    assert updated["description"] == update_data["description"]
    assert updated["icon"] == update_data["icon"]
    assert updated["color"] == update_data["color"]
    assert updated["is_income"] == category_data["is_income"]  # Не изменилось


def test_delete_category(authorized_client):
    """Тест удаления категории"""
    # Создаем категорию
    category_data = {
        "name": "To Delete",
        "description": "Will be deleted",
        "icon": "delete-icon",
        "color": "#FF0000",
        "is_income": True
    }

    create_response = authorized_client.post("/api/v1/categories/", json=category_data)
    assert create_response.status_code == 201
    category_id = create_response.json()["id"]

    # Удаляем категорию
    delete_response = authorized_client.delete(f"/api/v1/categories/{category_id}")

    assert delete_response.status_code == 200
    assert "message" in delete_response.json()

    # Проверяем, что категория удалена
    get_response = authorized_client.get(f"/api/v1/categories/{category_id}")
    assert get_response.status_code == 404


@pytest.mark.skip("Требуется доработка схемы SystemCategoriesResponse")
def test_cannot_delete_system_category(authorized_client):
    """Тест невозможности удаления системной категории"""
    # Получаем системные категории
    system_response = authorized_client.get("/api/v1/categories/system")
    assert system_response.status_code == 200

    # Берем первую системную категорию
    system_id = system_response.json()["income_categories"][0]["id"]

    # Пытаемся удалить системную категорию
    delete_response = authorized_client.delete(f"/api/v1/categories/{system_id}")

    # Должны получить ошибку 403 Forbidden
    assert delete_response.status_code == 403
    assert "detail" in delete_response.json()


@pytest.mark.skip("Требуется доработка схемы SystemCategoriesResponse")
def test_cannot_update_system_category(authorized_client):
    """Тест невозможности изменения системной категории"""
    # Получаем системные категории
    system_response = authorized_client.get("/api/v1/categories/system")
    assert system_response.status_code == 200

    # Берем первую системную категорию
    system_id = system_response.json()["income_categories"][0]["id"]

    # Пытаемся обновить системную категорию
    update_data = {
        "name": "Updated System Category"
    }

    update_response = authorized_client.put(f"/api/v1/categories/{system_id}", json=update_data)

    # Должны получить ошибку 403 Forbidden
    assert update_response.status_code == 403
    assert "detail" in update_response.json()  # tests/test_categories.py


import pytest


def test_get_system_categories(authorized_client):
    """Тест получения системных категорий"""
    response = authorized_client.get("/api/v1/categories/system")

    assert response.status_code == 200
    data = response.json()

    # Проверяем структуру данных
    assert "income_categories" in data
    assert "expense_categories" in data
    assert isinstance(data["income_categories"], list)
    assert isinstance(data["expense_categories"], list)

    # Проверяем, что есть как минимум несколько категорий
    assert len(data["income_categories"]) > 0
    assert len(data["expense_categories"]) > 0

    # Проверяем содержимое категорий
    for category in data["income_categories"] + data["expense_categories"]:
        assert "id" in category
        assert "name" in category
        assert "is_income" in category


def test_create_category(authorized_client):
    """Тест создания новой категории"""
    category_data = {
        "name": "Test Category",
        "description": "This is a test category",
        "icon": "test-icon",
        "color": "#FF5733",
        "is_income": True
    }

    response = authorized_client.post("/api/v1/categories/", json=category_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == category_data["name"]
    assert data["description"] == category_data["description"]
    assert data["icon"] == category_data["icon"]
    assert data["color"] == category_data["color"]
    assert data["is_income"] == category_data["is_income"]
    assert "id" in data
    assert "user_id" in data


def test_get_categories(authorized_client):
    """Тест получения всех категорий пользователя"""
    # Создаем несколько категорий
    for i in range(3):
        category_data = {
            "name": f"Category {i + 1}",
            "description": f"Description {i + 1}",
            "icon": f"icon-{i + 1}",
            "color": f"#00{i + 1}000",
            "is_income": i % 2 == 0  # Чередуем доход/расход
        }
        response = authorized_client.post("/api/v1/categories/", json=category_data)
        assert response.status_code == 201

    # Получаем все категории
    response = authorized_client.get("/api/v1/categories/")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    # Должны быть как минимум те 3 категории, которые мы создали
    assert len(data) >= 3

    # Проверяем структуру данных
    for category in data:
        assert "id" in category
        assert "name" in category
        assert "description" in category
        assert "icon" in category
        assert "color" in category
        assert "is_income" in category
        assert "subcategories" in category


def test_create_subcategory(authorized_client):
    """Тест создания подкатегории"""
    # Создаем родительскую категорию
    parent_data = {
        "name": "Parent Category",
        "description": "Parent description",
        "icon": "parent-icon",
        "color": "#123456",
        "is_income": False
    }

    parent_response = authorized_client.post("/api/v1/categories/", json=parent_data)
    assert parent_response.status_code == 201
    parent_id = parent_response.json()["id"]

    # Создаем подкатегорию
    child_data = {
        "name": "Child Category",
        "description": "Child description",
        "icon": "child-icon",
        "color": "#654321",
        "is_income": False,
        "parent_id": parent_id
    }

    child_response = authorized_client.post("/api/v1/categories/", json=child_data)

    assert child_response.status_code == 201
    child = child_response.json()
    assert child["name"] == child_data["name"]
    assert child["parent_id"] == parent_id

    # Проверяем, что подкатегория появилась в родительской категории
    get_response = authorized_client.get(f"/api/v1/categories/{parent_id}")
    assert get_response.status_code == 200
    parent = get_response.json()
    assert len(parent["subcategories"]) == 1
    assert parent["subcategories"][0]["id"] == child["id"]
    assert parent["subcategories"][0]["name"] == child["name"]


def test_update_category(authorized_client):
    """Тест обновления категории"""
    # Создаем категорию
    category_data = {
        "name": "Original Name",
        "description": "Original description",
        "icon": "original-icon",
        "color": "#AAAAAA",
        "is_income": True
    }

    create_response = authorized_client.post("/api/v1/categories/", json=category_data)
    assert create_response.status_code == 201
    category_id = create_response.json()["id"]

    # Обновляем категорию
    update_data = {
        "name": "Updated Name",
        "description": "Updated description",
        "icon": "updated-icon",
        "color": "#BBBBBB"
    }

    update_response = authorized_client.put(f"/api/v1/categories/{category_id}", json=update_data)

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == update_data["name"]
    assert updated["description"] == update_data["description"]
    assert updated["icon"] == update_data["icon"]
    assert updated["color"] == update_data["color"]
    assert updated["is_income"] == category_data["is_income"]  # Не изменилось


def test_delete_category(authorized_client):
    """Тест удаления категории"""
    # Создаем категорию
    category_data = {
        "name": "To Delete",
        "description": "Will be deleted",
        "icon": "delete-icon",
        "color": "#FF0000",
        "is_income": True
    }

    create_response = authorized_client.post("/api/v1/categories/", json=category_data)
    assert create_response.status_code == 201
    category_id = create_response.json()["id"]

    # Удаляем категорию
    delete_response = authorized_client.delete(f"/api/v1/categories/{category_id}")

    assert delete_response.status_code == 200
    assert "message" in delete_response.json()

    # Проверяем, что категория удалена
    get_response = authorized_client.get(f"/api/v1/categories/{category_id}")
    assert get_response.status_code == 404


def test_cannot_delete_system_category(authorized_client):
    """Тест невозможности удаления системной категории"""
    # Получаем системные категории
    system_response = authorized_client.get("/api/v1/categories/system")
    assert system_response.status_code == 200

    # Берем первую системную категорию
    system_id = system_response.json()["income_categories"][0]["id"]

    # Пытаемся удалить системную категорию
    delete_response = authorized_client.delete(f"/api/v1/categories/{system_id}")

    # Должны получить ошибку 403 Forbidden
    assert delete_response.status_code == 403
    assert "detail" in delete_response.json()


def test_cannot_update_system_category(authorized_client):
    """Тест невозможности изменения системной категории"""
    # Получаем системные категории
    system_response = authorized_client.get("/api/v1/categories/system")
    assert system_response.status_code == 200

    # Берем первую системную категорию
    system_id = system_response.json()["income_categories"][0]["id"]

    # Пытаемся обновить системную категорию
    update_data = {
        "name": "Updated System Category"
    }

    update_response = authorized_client.put(f"/api/v1/categories/{system_id}", json=update_data)

    # Должны получить ошибку 403 Forbidden
    assert update_response.status_code == 403
    assert "detail" in update_response.json()