# app/api/v1/categories.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CategoryWithSubcategories, SystemCategoriesResponse
)
from app.services.category import CategoryService
from app.utils.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(
    prefix="/categories",
    tags=["Budget Categories"]
)


@router.get("/", response_model=List[CategoryWithSubcategories])
async def get_categories(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить все категории пользователя"""
    categories = await CategoryService.get_categories(current_user.id, db)
    return categories


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
        category_data: CategoryCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Создать новую категорию"""
    category = await CategoryService.create_category(current_user.id, category_data, db)
    return category


@router.get("/system", response_model=SystemCategoriesResponse)
async def get_system_categories(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить системные категории пользователя"""
    categories = await CategoryService.get_system_categories(current_user.id, db)

    # Если системных категорий нет, создаем стандартные
    if not categories["income_categories"] and not categories["expense_categories"]:
        categories = await CategoryService.create_default_categories(current_user.id, db)

    return SystemCategoriesResponse(
        income_categories=categories["income_categories"],
        expense_categories=categories["expense_categories"]
    )


@router.get("/{category_id}", response_model=CategoryWithSubcategories)
async def get_category(
        category_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить категорию по ID"""
    category = await CategoryService.get_category(category_id, current_user.id, db)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
        category_id: int,
        category_data: CategoryUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить категорию"""
    category = await CategoryService.update_category(
        category_id,
        current_user.id,
        category_data,
        db
    )
    return category


@router.delete("/{category_id}")
async def delete_category(
        category_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить категорию"""
    await CategoryService.delete_category(category_id, current_user.id, db)
    return {"message": "Category successfully deleted"}