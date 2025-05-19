# app/services/category.py
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.category import BudgetCategory, CategoryTypeEnum
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.pydantic_helpers import model_to_dict


class CategoryService:
    @staticmethod
    async def create_category(user_id: int, category_data: CategoryCreate, db: Session) -> BudgetCategory:
        """Создание новой категории бюджета"""
        # Создаем категорию
        category_dict = model_to_dict(category_data)
        category = BudgetCategory(user_id=user_id, **category_dict)

        db.add(category)
        db.commit()
        db.refresh(category)

        return category

    @staticmethod
    async def get_categories_by_type(user_id: int, category_type: CategoryTypeEnum, db: Session) -> List[
        BudgetCategory]:
        """Получение категорий определенного типа"""
        return db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.category_type == category_type
        ).order_by(BudgetCategory.position, BudgetCategory.name).all()

    @staticmethod
    async def get_categories(user_id: int, db: Session) -> Dict[str, List[BudgetCategory]]:
        """Получение всех категорий пользователя разделенных по типу"""
        expense_categories = await CategoryService.get_categories_by_type(
            user_id, CategoryTypeEnum.EXPENSE, db
        )
        income_categories = await CategoryService.get_categories_by_type(
            user_id, CategoryTypeEnum.INCOME, db
        )

        return {
            "expense_categories": expense_categories,
            "income_categories": income_categories
        }

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

        # Обновляем только переданные поля
        update_data = model_to_dict(category_data, exclude_unset=True)
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

        # Проверка транзакций с этой категорией
        from app.models.transaction import Transaction
        transactions_count = db.query(Transaction).filter(
            Transaction.category_id == category_id
        ).count()

        if transactions_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category with {transactions_count} linked transactions"
            )

        # Удаляем категорию
        db.delete(category)
        db.commit()

    @staticmethod
    async def create_default_categories(user_id: int, db: Session) -> Dict[str, List[BudgetCategory]]:
        """Создание стандартных категорий для нового пользователя"""
        # Создаем категории доходов
        income_categories = [
            BudgetCategory(
                user_id=user_id,
                name="Salary",
                icon="briefcase",
                color="#4CAF50",
                category_type=CategoryTypeEnum.INCOME,
                is_system=True,
                position=0
            ),
            BudgetCategory(
                user_id=user_id,
                name="Investment",
                icon="trending-up",
                color="#2196F3",
                category_type=CategoryTypeEnum.INCOME,
                is_system=True,
                position=1
            ),
            BudgetCategory(
                user_id=user_id,
                name="Savings",
                icon="piggy-bank",
                color="#9C27B0",
                category_type=CategoryTypeEnum.INCOME,
                is_system=True,
                position=2
            ),
            BudgetCategory(
                user_id=user_id,
                name="Bonus",
                icon="gift",
                color="#FF9800",
                category_type=CategoryTypeEnum.INCOME,
                is_system=True,
                position=3
            ),
        ]

        # Создаем категории расходов
        expense_categories = [
            BudgetCategory(
                user_id=user_id,
                name="Shopping",
                icon="cart",
                color="#f44336",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=0
            ),
            BudgetCategory(
                user_id=user_id,
                name="Food",
                icon="restaurant",
                color="#FF9800",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=1
            ),
            BudgetCategory(
                user_id=user_id,
                name="Transport",
                icon="car",
                color="#2196F3",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=2
            ),
            BudgetCategory(
                user_id=user_id,
                name="Bills",
                icon="receipt",
                color="#9C27B0",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=3
            ),
            BudgetCategory(
                user_id=user_id,
                name="Health Care",
                icon="medkit",
                color="#607D8B",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=4
            ),
            BudgetCategory(
                user_id=user_id,
                name="Entertainment",
                icon="game-controller",
                color="#795548",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=5
            ),
            BudgetCategory(
                user_id=user_id,
                name="Travel",
                icon="airplane",
                color="#FF5722",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=6
            ),
            BudgetCategory(
                user_id=user_id,
                name="Subscription",
                icon="tv",
                color="#673AB7",
                category_type=CategoryTypeEnum.EXPENSE,
                is_system=True,
                position=7
            ),
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
            BudgetCategory.category_type == CategoryTypeEnum.INCOME
        ).order_by(BudgetCategory.position, BudgetCategory.name).all()

        # Получаем системные категории расхода
        expense_categories = db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.is_system == True,
            BudgetCategory.category_type == CategoryTypeEnum.EXPENSE
        ).order_by(BudgetCategory.position, BudgetCategory.name).all()

        return {
            "income_categories": income_categories,
            "expense_categories": expense_categories
        }