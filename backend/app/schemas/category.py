# app/schemas/category.py
from pydantic import BaseModel, model_validator
from typing import Optional, List, Any
from datetime import datetime


# Базовые схемы для категории бюджета
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_income: bool = False
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_income: Optional[bool] = None
    parent_id: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    is_system: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Рекурсивная схема для категорий с подкатегориями
class CategoryWithSubcategories(CategoryResponse):
    subcategories: List['CategoryWithSubcategories'] = []

    class Config:
        from_attributes = True


# Разрешаем рекурсивное определение
CategoryWithSubcategories.model_rebuild()


# Схемы для системных категорий
class SystemCategoryBase(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_income: bool
    parent_id: Optional[int] = None


class SystemCategoriesResponse(BaseModel):
    income_categories: List[SystemCategoryBase] = []
    expense_categories: List[SystemCategoryBase] = []

    @model_validator(mode='after')
    def validate_categories(self) -> 'SystemCategoriesResponse':
        """Валидация списков категорий"""
        # Если значения не списки, преобразуем их в пустые списки
        if not isinstance(self.income_categories, list):
            self.income_categories = []
        if not isinstance(self.expense_categories, list):
            self.expense_categories = []

        # Проверяем каждую категорию
        valid_income_categories = []
        for cat in self.income_categories:
            if isinstance(cat, dict):
                try:
                    valid_income_categories.append(SystemCategoryBase(**cat))
                except:
                    pass
            elif isinstance(cat, SystemCategoryBase):
                valid_income_categories.append(cat)

        valid_expense_categories = []
        for cat in self.expense_categories:
            if isinstance(cat, dict):
                try:
                    valid_expense_categories.append(SystemCategoryBase(**cat))
                except:
                    pass
            elif isinstance(cat, SystemCategoryBase):
                valid_expense_categories.append(cat)

        self.income_categories = valid_income_categories
        self.expense_categories = valid_expense_categories

        return self