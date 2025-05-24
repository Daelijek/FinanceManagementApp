# app/services/transaction.py
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from fastapi import HTTPException, status, UploadFile
from datetime import datetime, date, timedelta
import calendar
from app.models.transaction import Transaction, PaymentMethodEnum
from app.models.category import BudgetCategory, CategoryTypeEnum
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionFilters, TransactionSummary
import os
import uuid
from app.config import settings
from app.services.pydantic_helpers import model_to_dict


class TransactionService:
    @staticmethod
    async def create_transaction(user_id: int, transaction_data: TransactionCreate, db: Session) -> Transaction:
        """Создание новой транзакции"""
        # Проверка существования категории, если она указана
        if transaction_data.category_id:
            category = db.query(BudgetCategory).filter(
                BudgetCategory.id == transaction_data.category_id,
                BudgetCategory.user_id == user_id
            ).first()

            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )

            # Проверка соответствия типа транзакции и категории
            if category.category_type != transaction_data.transaction_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot use {category.category_type} category for {transaction_data.transaction_type} transaction"
                )

        # Создаем транзакцию
        transaction_dict = model_to_dict(transaction_data)
        transaction = Transaction(user_id=user_id, **transaction_dict)

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        from app.services.notification import NotificationService
        await NotificationService.generate_transaction_notification(transaction.id, db)

        # Проверяем бюджет, если это расходная транзакция
        if transaction.transaction_type == CategoryTypeEnum.EXPENSE and transaction.category_id:
            from app.services.budget import BudgetService
            await BudgetService.check_budget_alerts(user_id, transaction.category_id, db)

        return transaction

    @staticmethod
    async def get_transaction(transaction_id: int, user_id: int, db: Session) -> Optional[Transaction]:
        """Получение транзакции по ID"""
        return db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id
        ).first()

    @staticmethod
    async def update_transaction(transaction_id: int, user_id: int, transaction_data: TransactionUpdate,
                                 db: Session) -> Transaction:
        """Обновление транзакции"""
        transaction = await TransactionService.get_transaction(transaction_id, user_id, db)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )

        # Проверка категории, если она обновляется
        if transaction_data.category_id is not None:
            if transaction_data.category_id > 0:
                category = db.query(BudgetCategory).filter(
                    BudgetCategory.id == transaction_data.category_id,
                    BudgetCategory.user_id == user_id
                ).first()

                if not category:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Category not found"
                    )

                # Проверка соответствия типа транзакции и категории
                transaction_type = transaction_data.transaction_type or transaction.transaction_type
                if category.category_type != transaction_type:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot use {category.category_type} category for {transaction_type} transaction"
                    )

        # Обновляем только переданные поля
        update_data = model_to_dict(transaction_data, exclude_unset=True)
        for field, value in update_data.items():
            setattr(transaction, field, value)

        db.commit()
        db.refresh(transaction)
        return transaction

    @staticmethod
    async def delete_transaction(transaction_id: int, user_id: int, db: Session) -> None:
        """Удаление транзакции"""
        transaction = await TransactionService.get_transaction(transaction_id, user_id, db)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )

        db.delete(transaction)
        db.commit()

    @staticmethod
    async def get_transactions(user_id: int, filters: Optional[TransactionFilters] = None,
                               skip: int = 0, limit: int = 100, db: Session = None) -> Tuple[
        List[Dict], TransactionSummary]:
        """Получение списка транзакций с применением фильтров"""
        # Базовый запрос для транзакций
        query = db.query(
            Transaction,
            BudgetCategory.name.label("category_name"),
            BudgetCategory.icon.label("category_icon"),
            BudgetCategory.color.label("category_color")
        ).outerjoin(
            BudgetCategory, Transaction.category_id == BudgetCategory.id
        ).filter(
            Transaction.user_id == user_id
        )

        # Применение фильтров
        if filters:
            if filters.start_date:
                start_date = datetime.combine(filters.start_date, datetime.min.time())
                query = query.filter(Transaction.transaction_date >= start_date)

            if filters.end_date:
                end_date = datetime.combine(filters.end_date, datetime.max.time())
                query = query.filter(Transaction.transaction_date <= end_date)

            if filters.transaction_type:
                query = query.filter(Transaction.transaction_type == filters.transaction_type)

            if filters.category_ids:
                query = query.filter(Transaction.category_id.in_(filters.category_ids))

            if filters.min_amount is not None:
                query = query.filter(Transaction.amount >= filters.min_amount)

            if filters.max_amount is not None:
                query = query.filter(Transaction.amount <= filters.max_amount)

            if filters.payment_method:
                query = query.filter(Transaction.payment_method == filters.payment_method)

        # Сортировка по дате (новые сначала)
        query = query.order_by(Transaction.transaction_date.desc())

        # Получение итогов для статистики
        total_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.INCOME
        ).scalar() or 0.0

        total_expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE
        ).scalar() or 0.0

        # Применение пагинации
        results = query.offset(skip).limit(limit).all()

        # Форматирование результатов в словари
        transactions = []
        for transaction, category_name, category_icon, category_color in results:
            transaction_dict = {
                "id": transaction.id,
                "user_id": transaction.user_id,
                "amount": transaction.amount,
                "transaction_type": transaction.transaction_type,
                "description": transaction.description,
                "transaction_date": transaction.transaction_date,
                "payment_method": transaction.payment_method,
                "is_recurring": transaction.is_recurring,
                "note": transaction.note,
                "category_id": transaction.category_id,
                "category_name": category_name,
                "category_icon": category_icon,
                "category_color": category_color,
                "receipt_photo_url": transaction.receipt_photo_url,
                "created_at": transaction.created_at,
                "updated_at": transaction.updated_at
            }
            transactions.append(transaction_dict)

        # Создание объекта со статистикой
        summary = TransactionSummary(
            total_income=total_income,
            total_expense=total_expense,
            net_balance=total_income - total_expense
        )

        return transactions, summary

    @staticmethod
    async def get_transactions_by_period(user_id: int, period: str, date_param: Optional[date] = None,
                                         db: Session = None) -> Tuple[List[Dict], TransactionSummary]:
        """Получение транзакций за определенный период (день/неделя/месяц/год)"""
        today = date_param or date.today()

        # Определение начальной и конечной даты периода
        if period == "day":
            start_date = today
            end_date = today
        elif period == "week":
            # Начало недели (понедельник)
            start_date = today - timedelta(days=today.weekday())
            # Конец недели (воскресенье)
            end_date = start_date + timedelta(days=6)
        elif period == "month":
            # Первый день месяца
            start_date = date(today.year, today.month, 1)
            # Последний день месяца
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = date(today.year, today.month, last_day)
        elif period == "year":
            # Первый день года
            start_date = date(today.year, 1, 1)
            # Последний день года
            end_date = date(today.year, 12, 31)
        else:
            # По умолчанию все транзакции
            return await TransactionService.get_transactions(user_id, None, 0, 1000, db)

        # Создаем фильтр на основе периода
        filters = TransactionFilters(
            start_date=start_date,
            end_date=end_date
        )

        return await TransactionService.get_transactions(user_id, filters, 0, 1000, db)

    @staticmethod
    async def upload_receipt_photo(transaction_id: int, user_id: int, file: UploadFile, db: Session) -> str:
        """Загрузка фото чека для транзакции"""
        transaction = await TransactionService.get_transaction(transaction_id, user_id, db)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )

        # Директория для хранения файлов
        upload_dir = f"{settings.UPLOAD_DIR}/receipts/{user_id}"
        os.makedirs(upload_dir, exist_ok=True)

        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = f"{upload_dir}/{unique_filename}"

        # Сохраняем файл
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Относительный путь для сохранения в БД
        relative_path = f"/receipts/{user_id}/{unique_filename}"

        # Обновляем информацию о транзакции
        transaction.receipt_photo_url = relative_path
        db.commit()

        return relative_path

    @staticmethod
    async def group_transactions_by_date(transactions: List[Dict]) -> List[Dict]:
        """Группировка транзакций по дате для вывода в формате секций"""
        result = {}

        for transaction in transactions:
            # Форматируем дату
            transaction_date = transaction["transaction_date"]
            today = datetime.now().date()

            if transaction_date.date() == today:
                date_key = "Today"
            elif transaction_date.date() == today - timedelta(days=1):
                date_key = "Yesterday"
            elif transaction_date.date() >= today - timedelta(days=7):
                date_key = "Earlier This Week"
            elif transaction_date.date().month == today.month:
                date_key = "This Month"
            else:
                # Форматируем дату как "Месяц Год"
                date_key = transaction_date.strftime("%B %Y")

            # Добавляем в соответствующую секцию
            if date_key not in result:
                result[date_key] = []

            result[date_key].append(transaction)

        # Преобразуем в формат секций для SectionList
        sections = []
        for title, data in result.items():
            sections.append({
                "title": title,
                "data": data
            })

        # Сортируем секции в порядке: Today, Yesterday, Earlier This Week, This Month, и затем по убыванию даты
        section_order = {"Today": 0, "Yesterday": 1, "Earlier This Week": 2, "This Month": 3}
        sections.sort(key=lambda x: section_order.get(x["title"], 4))

        return sections