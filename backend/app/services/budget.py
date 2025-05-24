# app/services/budget.py
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract, desc
from fastapi import HTTPException, status
from datetime import datetime, date, timedelta
from calendar import monthrange
from app.models.budget import Budget, BudgetPeriodEnum
from app.models.category import BudgetCategory, CategoryTypeEnum
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetSummary, QuickBudgetSetup
from app.services.pydantic_helpers import model_to_dict


class BudgetService:
    @staticmethod
    async def create_budget(user_id: int, budget_data: BudgetCreate, db: Session) -> Budget:
        """Создание нового бюджета"""
        # Проверяем существование категории
        category = db.query(BudgetCategory).filter(
            BudgetCategory.id == budget_data.category_id,
            BudgetCategory.user_id == user_id
        ).first()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        # Проверяем, что категория для расходов (бюджет только для расходов)
        if category.category_type != CategoryTypeEnum.EXPENSE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget can only be set for expense categories"
            )

        # Проверяем, нет ли уже активного бюджета для этой категории в указанный период
        existing_budget = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category_id == budget_data.category_id,
            Budget.is_active == True,
            Budget.start_date <= budget_data.end_date,
            Budget.end_date >= budget_data.start_date
        ).first()

        if existing_budget:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active budget already exists for this category in the specified period"
            )

        # Создаем бюджет
        budget_dict = model_to_dict(budget_data)
        budget = Budget(user_id=user_id, **budget_dict)

        db.add(budget)
        db.commit()
        db.refresh(budget)

        return budget

    @staticmethod
    async def get_budget(budget_id: int, user_id: int, db: Session) -> Optional[Budget]:
        """Получение бюджета по ID"""
        return db.query(Budget).filter(
            Budget.id == budget_id,
            Budget.user_id == user_id
        ).first()

    @staticmethod
    async def update_budget(budget_id: int, user_id: int, budget_data: BudgetUpdate,
                            db: Session) -> Budget:
        """Обновление бюджета"""
        budget = await BudgetService.get_budget(budget_id, user_id, db)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )

        # Обновляем только переданные поля
        update_data = model_to_dict(budget_data, exclude_unset=True)
        for field, value in update_data.items():
            setattr(budget, field, value)

        db.commit()
        db.refresh(budget)
        return budget

    @staticmethod
    async def delete_budget(budget_id: int, user_id: int, db: Session) -> None:
        """Удаление бюджета"""
        budget = await BudgetService.get_budget(budget_id, user_id, db)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )

        db.delete(budget)
        db.commit()

    @staticmethod
    async def get_monthly_budget_overview(user_id: int, year: int, month: int,
                                          db: Session) -> Dict:
        """Получение обзора бюджета за месяц"""
        # Определяем начало и конец месяца
        start_date = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = date(year, month, last_day)

        # Получаем все активные бюджеты за этот период
        budgets_query = db.query(
            Budget,
            BudgetCategory.name.label("category_name"),
            BudgetCategory.icon.label("category_icon"),
            BudgetCategory.color.label("category_color")
        ).join(
            BudgetCategory, Budget.category_id == BudgetCategory.id
        ).filter(
            Budget.user_id == user_id,
            Budget.is_active == True,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date
        ).order_by(Budget.amount.desc())

        budgets = budgets_query.all()

        # Рассчитываем потраченные суммы для каждого бюджета
        budget_list = []
        total_budget = 0
        total_spent = 0

        for budget, category_name, category_icon, category_color in budgets:
            # Рассчитываем потраченную сумму за период пересечения
            actual_start = max(budget.start_date, start_date)
            actual_end = min(budget.end_date, end_date)

            spent_amount = await BudgetService._calculate_spent_amount(
                user_id, budget.category_id, actual_start, actual_end, db
            )

            # Корректируем потраченную сумму относительно полного периода бюджета
            budget_days = (budget.end_date - budget.start_date).days + 1
            actual_days = (actual_end - actual_start).days + 1

            if budget_days > 0:
                spent_amount = spent_amount * (actual_days / budget_days)

            remaining_amount = max(0, budget.amount - spent_amount)
            usage_percentage = min(100, (spent_amount / budget.amount) * 100) if budget.amount > 0 else 0

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
                "remaining_amount": round(remaining_amount, 2),
                "usage_percentage": round(usage_percentage, 1),
                "created_at": budget.created_at,
                "updated_at": budget.updated_at,
                "category_name": category_name,
                "category_icon": category_icon,
                "category_color": category_color
            }

            budget_list.append(budget_dict)
            total_budget += budget.amount
            total_spent += spent_amount

        # Рассчитываем общую статистику
        total_remaining = max(0, total_budget - total_spent)
        overall_usage_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0
        over_budget_count = sum(1 for b in budget_list if b["usage_percentage"] > 100)

        summary = BudgetSummary(
            total_budget=round(total_budget, 2),
            total_spent=round(total_spent, 2),
            total_remaining=round(total_remaining, 2),
            overall_usage_percentage=round(overall_usage_percentage, 1),
            categories_count=len(budget_list),
            over_budget_count=over_budget_count
        )

        # Форматируем название периода
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        period_name = f"{month_names[month - 1]} {year}"

        return {
            "period": period_name,
            "total_budget": round(total_budget, 2),
            "spent": round(total_spent, 2),
            "remaining": round(total_remaining, 2),
            "usage_percentage": round(overall_usage_percentage, 1),
            "budgets_by_category": budget_list,
            "summary": summary
        }

    @staticmethod
    async def _calculate_spent_amount(user_id: int, category_id: int, start_date: date,
                                      end_date: date, db: Session) -> float:
        """Рассчет потраченной суммы по категории за период"""
        spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).scalar()

        return spent or 0.0

    @staticmethod
    async def get_budgets_by_period(user_id: int, start_date: date, end_date: date,
                                    db: Session) -> List[Dict]:
        """Получение всех бюджетов за период"""
        budgets_query = db.query(
            Budget,
            BudgetCategory.name.label("category_name"),
            BudgetCategory.icon.label("category_icon"),
            BudgetCategory.color.label("category_color")
        ).join(
            BudgetCategory, Budget.category_id == BudgetCategory.id
        ).filter(
            Budget.user_id == user_id,
            Budget.is_active == True,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date
        ).order_by(desc(Budget.amount))

        budgets = budgets_query.all()
        result = []

        for budget, category_name, category_icon, category_color in budgets:
            spent_amount = await BudgetService._calculate_spent_amount(
                user_id, budget.category_id, max(budget.start_date, start_date),
                min(budget.end_date, end_date), db
            )

            remaining_amount = max(0, budget.amount - spent_amount)
            usage_percentage = min(100, (spent_amount / budget.amount) * 100) if budget.amount > 0 else 0

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
                "remaining_amount": round(remaining_amount, 2),
                "usage_percentage": round(usage_percentage, 1),
                "created_at": budget.created_at,
                "updated_at": budget.updated_at,
                "category_name": category_name,
                "category_icon": category_icon,
                "category_color": category_color
            }

            result.append(budget_dict)

        return result

    @staticmethod
    async def setup_quick_budget(user_id: int, setup_data: QuickBudgetSetup,
                                 month: int, year: int, db: Session) -> List[Budget]:
        """Быстрая настройка бюджета с автоматическим распределением по категориям"""
        # Получаем все расходные категории пользователя
        expense_categories = db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.category_type == CategoryTypeEnum.EXPENSE
        ).all()

        if not expense_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No expense categories found for budget allocation"
            )

        # Определяем период (текущий месяц)
        start_date = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = date(year, month, last_day)

        # Удаляем существующие активные бюджеты за этот период
        db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date,
            Budget.is_active == True
        ).update({"is_active": False})

        # Рекомендуемое распределение бюджета по категориям (в процентах)
        default_allocations = {
            "Housing": 30,  # Жилье
            "Food": 15,  # Еда
            "Transport": 15,  # Транспорт
            "Shopping": 10,  # Покупки
            "Entertainment": 10,  # Развлечения
            "Health Care": 8,  # Здравоохранение
            "Bills": 7,  # Счета
            "Travel": 3,  # Путешествия
            "Subscription": 2  # Подписки
        }

        created_budgets = []
        total_allocated = 0

        if setup_data.auto_distribute:
            # Автоматическое распределение
            remaining_percentage = 100
            unallocated_categories = []

            for category in expense_categories:
                if category.name in default_allocations:
                    percentage = default_allocations[category.name]
                    amount = (setup_data.total_monthly_budget * percentage) / 100
                    remaining_percentage -= percentage
                else:
                    unallocated_categories.append(category)
                    continue

                # Создаем бюджет для категории
                budget = Budget(
                    user_id=user_id,
                    category_id=category.id,
                    amount=round(amount, 2),
                    period=BudgetPeriodEnum.MONTHLY,
                    start_date=start_date,
                    end_date=end_date,
                    is_active=True
                )

                db.add(budget)
                created_budgets.append(budget)
                total_allocated += amount

            # Распределяем оставшуюся сумму между неучтенными категориями
            if unallocated_categories and remaining_percentage > 0:
                remaining_amount = (setup_data.total_monthly_budget * remaining_percentage) / 100
                amount_per_category = remaining_amount / len(unallocated_categories)

                for category in unallocated_categories:
                    budget = Budget(
                        user_id=user_id,
                        category_id=category.id,
                        amount=round(amount_per_category, 2),
                        period=BudgetPeriodEnum.MONTHLY,
                        start_date=start_date,
                        end_date=end_date,
                        is_active=True
                    )

                    db.add(budget)
                    created_budgets.append(budget)

        db.commit()

        # Обновляем объекты из БД
        for budget in created_budgets:
            db.refresh(budget)

        return created_budgets

    @staticmethod
    async def check_budget_alerts(user_id: int, category_id: int, db: Session) -> None:
        """Проверка превышения бюджета и создание уведомлений"""
        from app.services.notification import NotificationService
        from app.schemas.notification import NotificationCreate
        from app.models.notification import NotificationTypeEnum, NotificationCategoryEnum

        # Получаем текущую дату
        today = date.today()

        # Находим активные бюджеты для данной категории
        active_budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category_id == category_id,
            Budget.is_active == True,
            Budget.start_date <= today,
            Budget.end_date >= today
        ).all()

        for budget in active_budgets:
            # Рассчитываем потраченную сумму
            spent_amount = await BudgetService._calculate_spent_amount(
                user_id, category_id, budget.start_date, budget.end_date, db
            )

            usage_percentage = (spent_amount / budget.amount * 100) if budget.amount > 0 else 0

            # Проверяем превышение бюджета (80% и 100%)
            if usage_percentage >= 100:
                # Проверяем, не создавали ли уже уведомление о превышении
                existing_notification = db.query(
                    NotificationService.model_class if hasattr(NotificationService, 'model_class') else None
                ).filter(
                    # Условия поиска существующего уведомления
                ).first()

                if not existing_notification:
                    # Создаем уведомление о превышении бюджета
                    category = db.query(BudgetCategory).filter(BudgetCategory.id == category_id).first()

                    notification_data = NotificationCreate(
                        user_id=user_id,
                        title="Budget Exceeded",
                        message=f"You've exceeded your {category.name} budget by ${spent_amount - budget.amount:.2f}",
                        notification_type=NotificationTypeEnum.BUDGET_GOAL_ACHIEVED,
                        category=NotificationCategoryEnum.BUDGET,
                        is_actionable=True,
                        action_url=f"/budgets/{budget.id}"
                    )

                    await NotificationService.create_notification(notification_data, db)

            elif usage_percentage >= 80:
                # Уведомление о приближении к лимиту (80%)
                category = db.query(BudgetCategory).filter(BudgetCategory.id == category_id).first()

                notification_data = NotificationCreate(
                    user_id=user_id,
                    title="Budget Alert",
                    message=f"You've used {usage_percentage:.0f}% of your {category.name} budget",
                    notification_type=NotificationTypeEnum.BUDGET_GOAL_ACHIEVED,
                    category=NotificationCategoryEnum.BUDGET,
                    is_actionable=True,
                    action_url=f"/budgets/{budget.id}"
                )

                await NotificationService.create_notification(notification_data, db)