# app/schemas/budget.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime, date
from app.models.budget import BudgetPeriodEnum


class BudgetBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0, description="Budget amount must be positive")
    period: BudgetPeriodEnum = BudgetPeriodEnum.MONTHLY
    start_date: date
    end_date: date

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, description="Budget amount must be positive")
    period: Optional[BudgetPeriodEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    is_active: bool
    spent_amount: float
    remaining_amount: float
    usage_percentage: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BudgetWithCategory(BudgetResponse):
    category_name: str
    category_icon: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    total_budget: float
    total_spent: float
    total_remaining: float
    overall_usage_percentage: float
    categories_count: int
    over_budget_count: int


class MonthlyBudgetOverview(BaseModel):
    period: str  # "September 2023"
    total_budget: float
    spent: float
    remaining: float
    usage_percentage: float
    budgets_by_category: List[BudgetWithCategory]
    summary: BudgetSummary


class QuickBudgetSetup(BaseModel):
    """Схема для быстрой настройки бюджета на основе системных категорий"""
    total_monthly_budget: float = Field(..., gt=0)
    auto_distribute: bool = True  # Автоматически распределить по категориям


class BudgetCategoryAllocation(BaseModel):
    """Распределение бюджета по категориям"""
    category_id: int
    category_name: str
    allocated_amount: float
    suggested_percentage: float