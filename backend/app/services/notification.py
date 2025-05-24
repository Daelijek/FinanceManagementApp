# app/services/notification.py
from typing import List, Optional, Dict, Tuple, Any
from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, date
from app.models.notification import Notification, NotificationTypeEnum, NotificationCategoryEnum
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationSummary
from app.models.user import User
from app.models.transaction import Transaction
import math
from app.services.pydantic_helpers import model_to_dict


class NotificationService:
    @staticmethod
    async def create_notification(notification_data: NotificationCreate, db: Session) -> Notification:
        """Создание нового уведомления"""
        # Проверка существования пользователя
        user = db.query(User).filter(User.id == notification_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Проверка существования транзакции, если указана
        if notification_data.transaction_id:
            transaction = db.query(Transaction).filter(
                Transaction.id == notification_data.transaction_id,
                Transaction.user_id == notification_data.user_id
            ).first()

            if not transaction:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Transaction not found or doesn't belong to the user"
                )

        # Определение иконки по умолчанию, если не указана
        if not notification_data.icon:
            notification_data.icon = NotificationService._get_default_icon(notification_data.notification_type)

        # Создаем уведомление
        notification_dict = model_to_dict(notification_data)
        notification = Notification(**notification_dict)

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    async def get_notification(notification_id: int, user_id: int, db: Session) -> Optional[Notification]:
        """Получение уведомления по ID"""
        return db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()

    @staticmethod
    async def update_notification(notification_id: int, user_id: int,
                                  notification_data: NotificationUpdate, db: Session) -> Notification:
        """Обновление уведомления (пометка как прочитанное)"""
        notification = await NotificationService.get_notification(notification_id, user_id, db)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        # Обновляем только переданные поля
        update_data = model_to_dict(notification_data, exclude_unset=True)
        for field, value in update_data.items():
            setattr(notification, field, value)

        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    async def delete_notification(notification_id: int, user_id: int, db: Session) -> None:
        """Удаление уведомления"""
        notification = await NotificationService.get_notification(notification_id, user_id, db)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        db.delete(notification)
        db.commit()

    @staticmethod
    async def mark_all_as_read(user_id: int, category: Optional[NotificationCategoryEnum] = None,
                               db: Session = None) -> int:
        """Пометить все уведомления пользователя как прочитанные"""
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        )

        # Если указана категория, фильтруем по ней
        if category and category != NotificationCategoryEnum.ALL:
            query = query.filter(Notification.category == category)

        # Обновляем все подходящие уведомления
        count = query.update({"is_read": True}, synchronize_session=False)
        db.commit()

        return count

    @staticmethod
    async def get_notifications(user_id: int, category: Optional[NotificationCategoryEnum] = None,
                                limit: int = 50, skip: int = 0, include_read: bool = False,
                                db: Session = None) -> Tuple[List[Dict], NotificationSummary]:
        """Получение уведомлений пользователя"""
        # Базовый запрос
        query = db.query(Notification).filter(Notification.user_id == user_id)

        # Фильтрация по статусу прочтения
        if not include_read:
            query = query.filter(Notification.is_read == False)

        # Фильтрация по категории
        if category and category != NotificationCategoryEnum.ALL:
            query = query.filter(Notification.category == category)

        # Сортировка по дате создания (новые сначала)
        query = query.order_by(desc(Notification.created_at))

        # Получение статистики
        summary = await NotificationService._get_notification_summary(user_id, db)

        # Применение пагинации
        notifications = query.offset(skip).limit(limit).all()

        # Группировка по дате
        grouped_notifications = await NotificationService._group_notifications_by_date(notifications)

        return grouped_notifications, summary

    @staticmethod
    async def _get_notification_summary(user_id: int, db: Session) -> NotificationSummary:
        """Получение статистики по уведомлениям"""
        # Общее количество уведомлений
        total = db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id
        ).scalar() or 0

        # Количество непрочитанных уведомлений
        unread = db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).scalar() or 0

        # Количество по категориям
        by_category = {}
        for category in NotificationCategoryEnum:
            count = db.query(func.count(Notification.id)).filter(
                Notification.user_id == user_id,
                Notification.category == category,
                Notification.is_read == False
            ).scalar() or 0

            by_category[category] = count

        return NotificationSummary(
            total=total,
            unread=unread,
            by_category=by_category
        )

    @staticmethod
    async def _group_notifications_by_date(notifications: List[Notification]) -> List[Dict]:
        """Группировка уведомлений по дате"""
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        groups = {
            "Today": [],
            "Yesterday": [],
            "Earlier This Week": []
        }

        for notification in notifications:
            notification_dict = {
                "id": notification.id,
                "user_id": notification.user_id,
                "title": notification.title,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "category": notification.category,
                "icon": notification.icon,
                "is_read": notification.is_read,
                "is_actionable": notification.is_actionable,
                "action_url": notification.action_url,
                "transaction_id": notification.transaction_id,
                "created_at": notification.created_at,
                "relative_time": NotificationService._get_relative_time(notification.created_at)
            }

            notification_date = notification.created_at.date()

            if notification_date == today:
                groups["Today"].append(notification_dict)
            elif notification_date == yesterday:
                groups["Yesterday"].append(notification_dict)
            elif notification_date > today - timedelta(days=7):
                groups["Earlier This Week"].append(notification_dict)
            else:
                # Создаем группу по месяцу, если уведомление старше недели
                month_group = notification.created_at.strftime("%B %Y")
                if month_group not in groups:
                    groups[month_group] = []
                groups[month_group].append(notification_dict)

        # Преобразуем в список групп
        result = []
        for title, notifications in groups.items():
            if notifications:  # Включаем только непустые группы
                result.append({
                    "title": title,
                    "notifications": notifications
                })

        return result

    @staticmethod
    def _get_relative_time(timestamp: datetime) -> str:
        """Получение относительного времени в стиле '2 hours ago'"""
        now = datetime.now()
        if timestamp.tzinfo:
            now = now.replace(tzinfo=timestamp.tzinfo)

        diff = now - timestamp
        seconds = diff.total_seconds()

        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = math.floor(seconds / 60)
            return f"{minutes} {'minute' if minutes == 1 else 'minutes'} ago"
        elif seconds < 86400:
            hours = math.floor(seconds / 3600)
            return f"{hours} {'hour' if hours == 1 else 'hours'} ago"
        elif seconds < 604800:
            days = math.floor(seconds / 86400)
            return f"{days} {'day' if days == 1 else 'days'} ago"
        else:
            weeks = math.floor(seconds / 604800)
            return f"{weeks} {'week' if weeks == 1 else 'weeks'} ago"

    @staticmethod
    def _get_default_icon(notification_type: NotificationTypeEnum) -> str:
        """Получение иконки по умолчанию для типа уведомления"""
        icons = {
            NotificationTypeEnum.LARGE_TRANSACTION: "cash-outline",
            NotificationTypeEnum.UPCOMING_BILL: "calendar-outline",
            NotificationTypeEnum.NEW_DEVICE_LOGIN: "lock-closed-outline",
            NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: "checkmark-circle-outline",
            NotificationTypeEnum.WEEKLY_SUMMARY: "stats-chart-outline",
            NotificationTypeEnum.SECURITY_ALERT: "warning-outline",
            NotificationTypeEnum.SUBSCRIPTION_RENEWAL: "refresh-outline"
        }

        return icons.get(notification_type, "notifications-outline")

    @staticmethod
    async def generate_transaction_notification(transaction_id: int, db: Session) -> Optional[Notification]:
        """Генерация уведомления на основе транзакции"""
        # Получаем транзакцию
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return None

        # Определяем, является ли транзакция крупной (пример: сумма > 500)
        if transaction.amount > 500:
            # Формируем данные для уведомления
            notification_data = NotificationCreate(
                user_id=transaction.user_id,
                title="Large Transaction Detected",
                message=f"${transaction.amount:.2f} {'received' if transaction.transaction_type == 'income' else 'spent'}",
                notification_type=NotificationTypeEnum.LARGE_TRANSACTION,
                category=NotificationCategoryEnum.TRANSACTIONS,
                transaction_id=transaction.id,
                is_actionable=True,
                action_url=f"/transactions/{transaction.id}"
            )

            # Создаем уведомление
            return await NotificationService.create_notification(notification_data, db)

        return None

    # app/services/notification.py (добавляем метод)
    @staticmethod
    async def generate_weekly_summary(user_id: int, db: Session) -> Optional[Notification]:
        """Генерация еженедельного отчета по расходам"""
        from app.models.transaction import Transaction
        from app.models.category import CategoryTypeEnum
        from sqlalchemy import func
        from datetime import datetime, timedelta

        # Определяем начало и конец текущей недели
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # Получаем сумму расходов за неделю
        total_expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= start_of_week,
            Transaction.transaction_date <= end_of_week
        ).scalar() or 0

        # Получаем сумму доходов за неделю
        total_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.INCOME,
            Transaction.transaction_date >= start_of_week,
            Transaction.transaction_date <= end_of_week
        ).scalar() or 0

        # Получаем количество транзакций
        transactions_count = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_of_week,
            Transaction.transaction_date <= end_of_week
        ).scalar() or 0

        # Определяем статус (на основе соотношения доходы/расходы)
        status = "on track"
        if total_expense > total_income:
            status = "overspending"
        elif total_income > total_expense * 1.5:
            status = "saving well"

        # Формируем сообщение
        message = f"This week: {transactions_count} transactions, ${total_expense:.2f} spent. You're {status}."

        # Создаем уведомление с недельным отчетом
        notification_data = NotificationCreate(
            user_id=user_id,
            title="Weekly Spending Summary",
            message=message,
            notification_type=NotificationTypeEnum.WEEKLY_SUMMARY,
            category=NotificationCategoryEnum.ALL,
            is_actionable=False
        )

        # Создаем уведомление
        try:
            return await NotificationService.create_notification(notification_data, db)
        except:
            return None