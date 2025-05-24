# app/api/v1/budgets.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from fastapi import Path
from calendar import monthrange
from app.database import get_db
from app.models import Budget, BudgetCategory
from app.models.user import User
from app.utils.dependencies import get_current_active_user
from app.services.budget import BudgetService
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithCategory,
    MonthlyBudgetOverview, QuickBudgetSetup
)
from app.utils.test_data import create_test_budgets

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
        budget_data: BudgetCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Создать новый бюджет"""
    budget = await BudgetService.create_budget(current_user.id, budget_data, db)

    # Рассчитываем потраченную сумму (для нового бюджета будет 0)
    spent_amount = await BudgetService._calculate_spent_amount(
        current_user.id, budget.category_id, budget.start_date, budget.end_date, db
    )

    # Формируем ответ с рассчитанными полями
    budget_dict = {
        "id": budget.id,
        "user_id": budget.user_id,
        "category_id": budget.category_id,
        "amount": budget.amount,
        "period": budget.period,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "is_active": budget.is_active,
        "spent_amount": round(spent_amount, 2),
        "remaining_amount": round(budget.amount - spent_amount, 2),
        "usage_percentage": round((spent_amount / budget.amount) * 100 if budget.amount > 0 else 0, 1),
        "created_at": budget.created_at,
        "updated_at": budget.updated_at
    }

    return budget_dict


@router.get("/monthly/{year}/{month}", response_model=MonthlyBudgetOverview)
async def get_monthly_budget_overview(
    year: int = Path(..., ge=2020, le=2030),
    month: int = Path(..., ge=1, le=12),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получить обзор бюджета за месяц"""
    if year < 2020 or year > 2030:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Year must be between 2020 and 2030"
        )

    overview = await BudgetService.get_monthly_budget_overview(current_user.id, year, month, db)
    return overview


@router.get("/current-month", response_model=MonthlyBudgetOverview)
async def get_current_month_budget(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить обзор бюджета за текущий месяц"""
    now = datetime.now()
    overview = await BudgetService.get_monthly_budget_overview(current_user.id, now.year, now.month, db)
    return overview


@router.get("/period")
async def get_budgets_by_period(
        start_date: date,
        end_date: date,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить бюджеты за период"""
    if end_date <= start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )

    budgets = await BudgetService.get_budgets_by_period(current_user.id, start_date, end_date, db)
    return {"budgets": budgets}


@router.get("/{budget_id}", response_model=BudgetWithCategory)
async def get_budget(
        budget_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить бюджет по ID"""
    # Получаем бюджет с информацией о категории
    budget_query = db.query(
        Budget,
        BudgetCategory.name.label("category_name"),
        BudgetCategory.icon.label("category_icon"),
        BudgetCategory.color.label("category_color")
    ).join(
        BudgetCategory, Budget.category_id == BudgetCategory.id
    ).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()

    if not budget_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )

    budget, category_name, category_icon, category_color = budget_query

    # Рассчитываем потраченную сумму
    spent_amount = await BudgetService._calculate_spent_amount(
        current_user.id, budget.category_id, budget.start_date, budget.end_date, db
    )

    # Формируем ответ
    budget_dict = {
        "id": budget.id,
        "user_id": budget.user_id,
        "category_id": budget.category_id,
        "amount": budget.amount,
        "period": budget.period,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "is_active": budget.is_active,
        "spent_amount": round(spent_amount, 2),
        "remaining_amount": round(max(0, budget.amount - spent_amount), 2),
        "usage_percentage": round(min(100, (spent_amount / budget.amount) * 100) if budget.amount > 0 else 0, 1),
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
        "category_name": category_name,
        "category_icon": category_icon,
        "category_color": category_color
    }

    return budget_dict


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
        budget_id: int,
        budget_data: BudgetUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить бюджет"""
    budget = await BudgetService.update_budget(budget_id, current_user.id, budget_data, db)

    # Рассчитываем потраченную сумму
    spent_amount = await BudgetService._calculate_spent_amount(
        current_user.id, budget.category_id, budget.start_date, budget.end_date, db
    )

    # Формируем ответ с рассчитанными полями
    budget_dict = {
        "id": budget.id,
        "user_id": budget.user_id,
        "category_id": budget.category_id,
        "amount": budget.amount,
        "period": budget.period,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "is_active": budget.is_active,
        "spent_amount": round(spent_amount, 2),
        "remaining_amount": round(budget.amount - spent_amount, 2),
        "usage_percentage": round((spent_amount / budget.amount) * 100 if budget.amount > 0 else 0, 1),
        "created_at": budget.created_at,
        "updated_at": budget.updated_at
    }

    return budget_dict


@router.delete("/{budget_id}")
async def delete_budget(
        budget_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить бюджет"""
    await BudgetService.delete_budget(budget_id, current_user.id, db)
    return {"message": "Budget successfully deleted"}


@router.post("/quick-setup", response_model=List[BudgetResponse])
async def setup_quick_budget(
        setup_data: QuickBudgetSetup,
        month: int = Query(None, ge=1, le=12, description="Month (1-12), defaults to current month"),
        year: int = Query(None, ge=2020, le=2030, description="Year, defaults to current year"),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Быстрая настройка месячного бюджета"""
    now = datetime.now()
    if month is None:
        month = now.month
    if year is None:
        year = now.year

    budgets = await BudgetService.setup_quick_budget(current_user.id, setup_data, month, year, db)

    # Форматируем ответ
    result = []
    for budget in budgets:
        budget_dict = budget.__dict__.copy()
        budget_dict["spent_amount"] = 0.0
        budget_dict["remaining_amount"] = budget.amount
        budget_dict["usage_percentage"] = 0.0
        result.append(budget_dict)

    return result


@router.post("/{budget_id}/deactivate")
async def deactivate_budget(
        budget_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Деактивировать бюджет"""
    from app.schemas.budget import BudgetUpdate

    budget_update = BudgetUpdate(is_active=False)
    budget = await BudgetService.update_budget(budget_id, current_user.id, budget_update, db)
    return {"message": "Budget deactivated successfully"}

@router.post("/generate-test-data", status_code=status.HTTP_201_CREATED)
async def generate_test_budgets(
    year: int = Query(2023, description="Year for test budgets"),
    month: int = Query(9, ge=1, le=12, description="Month for test budgets"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Генерация тестовых бюджетов (только для разработки)"""
    budgets = await create_test_budgets(current_user.id, db, year, month)
    return {"message": f"Successfully generated {len(budgets)} test budgets"}