# app/services/category.py
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.category import BudgetCategory
from app.schemas.category import CategoryCreate, CategoryUpdate, SystemCategoryBase


class CategoryService:
    @staticmethod
    async def create_category(user_id: int, category_data: CategoryCreate, db: Session) -> BudgetCategory:
        """Создание новой категории бюджета"""
        # Проверяем родительскую категорию, если указана
        if category_data.parent_id:
            parent = db.query(BudgetCategory).filter(
                BudgetCategory.id == category_data.parent_id,
                BudgetCategory.user_id == user_id
            ).first()

            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found"
                )

        # Создаем категорию
        category = BudgetCategory(
            user_id=user_id,
            **category_data.dict()
        )

        db.add(category)
        db.commit()
        db.refresh(category)

        return category

    @staticmethod
    async def get_categories(user_id: int, db: Session) -> List[BudgetCategory]:
        """Получение всех категорий пользователя"""
        return db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.parent_id.is_(None)  # Только верхнего уровня
        ).all()

    @staticmethod
    async def get_category(category_id: int, user_id: int, db: Session) -> Optional[BudgetCategory]:
        """Получение категории по ID"""
        return db.query(BudgetCategory).filter(
            BudgetCategory.id == category_id,
            BudgetCategory.user_id == user_id
        ).first()

    @staticmethod
    async def update_category(category_id: int, user_id: int, category_data: CategoryUpdate,
                              db: Session) -> BudgetCategory:
        """Обновление категории"""
        category = await CategoryService.get_category(category_id, user_id, db)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        # Проверка системной категории
        if category.is_system:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify system category"
            )

        # Проверка родительской категории
        if category_data.parent_id and category_data.parent_id != category.parent_id:
            parent = await CategoryService.get_category(category_data.parent_id, user_id, db)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found"
                )

            # Проверка цикличности (категория не может быть своим собственным предком)
            if await CategoryService._is_cyclic(category_id, category_data.parent_id, user_id, db):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot set parent: would create a cycle"
                )

        # Обновляем только переданные поля
        update_data = category_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)

        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    async def delete_category(category_id: int, user_id: int, db: Session) -> None:
        """Удаление категории"""
        category = await CategoryService.get_category(category_id, user_id, db)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        # Проверка системной категории
        if category.is_system:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete system category"
            )

        # Проверяем, есть ли подкатегории
        subcategories = db.query(BudgetCategory).filter(
            BudgetCategory.parent_id == category_id
        ).all()

        # Если есть подкатегории, перемещаем их на уровень выше
        for subcategory in subcategories:
            subcategory.parent_id = category.parent_id

        # Удаляем категорию
        db.delete(category)
        db.commit()

    @staticmethod
    async def create_default_categories(user_id: int, db: Session) -> Dict[str, List[BudgetCategory]]:
        """Создание стандартных категорий для нового пользователя"""
        # Создаем категории доходов
        income_categories = [
            BudgetCategory(user_id=user_id, name="Salary", icon="wallet", color="#4CAF50", is_income=True,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Investments", icon="chart-line", color="#2196F3", is_income=True,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Gifts", icon="gift", color="#9C27B0", is_income=True, is_system=True),
            BudgetCategory(user_id=user_id, name="Side Hustle", icon="briefcase", color="#FF9800", is_income=True,
                           is_system=True),
        ]

        # Создаем категории расходов
        expense_categories = [
            BudgetCategory(user_id=user_id, name="Housing", icon="home", color="#f44336", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Food", icon="restaurant", color="#FF9800", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Transportation", icon="car", color="#2196F3", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Entertainment", icon="movie", color="#9C27B0", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Shopping", icon="shopping-cart", color="#4CAF50", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Health", icon="hospital", color="#607D8B", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Education", icon="school", color="#795548", is_income=False,
                           is_system=True),
            BudgetCategory(user_id=user_id, name="Utilities", icon="bolt", color="#FF5722", is_income=False,
                           is_system=True),
        ]

        # Добавляем все категории в БД
        db.add_all(income_categories + expense_categories)
        db.commit()

        # Обновляем объекты из БД
        for category in income_categories + expense_categories:
            db.refresh(category)

        return {
            "income_categories": income_categories,
            "expense_categories": expense_categories
        }

    @staticmethod
    async def get_system_categories(user_id: int, db: Session) -> Dict[str, List[BudgetCategory]]:
        """Получение системных категорий пользователя"""
        # Получаем системные категории дохода
        income_categories = db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.is_system == True,
            BudgetCategory.is_income == True
        ).all()

        # Получаем системные категории расхода
        expense_categories = db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.is_system == True,
            BudgetCategory.is_income == False
        ).all()

        return {
            "income_categories": income_categories,
            "expense_categories": expense_categories
        }

    @staticmethod
    async def _is_cyclic(category_id: int, parent_id: int, user_id: int, db: Session) -> bool:
        """Проверка на цикличность при изменении родительской категории"""
        if category_id == parent_id:
            return True

        current = parent_id
        while current is not None:
            parent = db.query(BudgetCategory).filter(
                BudgetCategory.id == current,
                BudgetCategory.user_id == user_id
            ).first()

            if not parent:
                return False

            if parent.id == category_id:
                return True

            current = parent.parent_id

        return False