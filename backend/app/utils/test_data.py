# app/utils/test_data.py
from app.models.notification import Notification, NotificationTypeEnum, NotificationCategoryEnum
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random


async def create_test_notifications(user_id: int, db: Session, count: int = 10):
    """Создание тестовых уведомлений для пользователя"""
    notification_types = list(NotificationTypeEnum)
    categories = {
        NotificationTypeEnum.LARGE_TRANSACTION: NotificationCategoryEnum.TRANSACTIONS,
        NotificationTypeEnum.UPCOMING_BILL: NotificationCategoryEnum.BILLS,
        NotificationTypeEnum.NEW_DEVICE_LOGIN: NotificationCategoryEnum.SECURITY,
        NotificationTypeEnum.SECURITY_ALERT: NotificationCategoryEnum.SECURITY,
        NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: NotificationCategoryEnum.BUDGET,
        NotificationTypeEnum.WEEKLY_SUMMARY: NotificationCategoryEnum.ALL,
        NotificationTypeEnum.SUBSCRIPTION_RENEWAL: NotificationCategoryEnum.BILLS
    }

    titles = {
        NotificationTypeEnum.LARGE_TRANSACTION: "Large Transaction Detected",
        NotificationTypeEnum.UPCOMING_BILL: "Upcoming Bill Payment",
        NotificationTypeEnum.NEW_DEVICE_LOGIN: "New Device Login",
        NotificationTypeEnum.SECURITY_ALERT: "Security Alert",
        NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: "Budget Goal Achieved",
        NotificationTypeEnum.WEEKLY_SUMMARY: "Weekly Spending Summary",
        NotificationTypeEnum.SUBSCRIPTION_RENEWAL: "Subscription Renewal"
    }

    messages = {
        NotificationTypeEnum.LARGE_TRANSACTION: [
            "$500 spent at Amazon",
            "$750 spent at Apple Store",
            "$600 transfer to Savings Account"
        ],
        NotificationTypeEnum.UPCOMING_BILL: [
            "Electric Bill due in 2 days",
            "Rent payment due tomorrow",
            "Internet subscription expires next week"
        ],
        NotificationTypeEnum.NEW_DEVICE_LOGIN: [
            "Login from iPhone 14",
            "New login from Windows PC",
            "Access from unrecognized device"
        ],
        NotificationTypeEnum.SECURITY_ALERT: [
            "Password change attempt detected",
            "Suspicious login attempt blocked",
            "Email address verification required"
        ],
        NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: [
            "Savings goal reached",
            "Budget target achieved",
            "Monthly expense limit maintained"
        ],
        NotificationTypeEnum.WEEKLY_SUMMARY: [
            "Your spending is on track",
            "You saved 15% more than last week",
            "Weekly spending report available"
        ],
        NotificationTypeEnum.SUBSCRIPTION_RENEWAL: [
            "Netflix subscription will renew tomorrow",
            "Office 365 subscription renewed",
            "Spotify Premium membership expiring soon"
        ]
    }

    icons = {
        NotificationTypeEnum.LARGE_TRANSACTION: "cash-outline",
        NotificationTypeEnum.UPCOMING_BILL: "calendar-outline",
        NotificationTypeEnum.NEW_DEVICE_LOGIN: "lock-closed-outline",
        NotificationTypeEnum.SECURITY_ALERT: "warning-outline",
        NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: "checkmark-circle-outline",
        NotificationTypeEnum.WEEKLY_SUMMARY: "stats-chart-outline",
        NotificationTypeEnum.SUBSCRIPTION_RENEWAL: "refresh-outline"
    }

    # Создаем уведомления с разными датами
    now = datetime.now()
    notifications = []

    for i in range(count):
        # Выбираем случайный тип уведомления
        notification_type = random.choice(notification_types)
        category = categories[notification_type]

        # Определяем заголовок и сообщение
        title = titles[notification_type]
        message = random.choice(messages[notification_type])

        # Определяем время создания (от сейчас до 10 дней назад)
        days_ago = random.randint(0, 10)
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        created_at = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)

        # Определяем, прочитано ли уведомление (более старые с большей вероятностью прочитаны)
        is_read = random.random() < (days_ago / 10)

        # Создаем уведомление
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            category=category,
            icon=icons[notification_type],
            is_read=is_read,
            is_actionable=random.random() < 0.3,  # 30% уведомлений могут иметь действие
            action_url=f"/actions/{notification_type}" if random.random() < 0.3 else None,
            created_at=created_at
        )

        notifications.append(notification)

    # Добавляем все уведомления в базу данных
    db.add_all(notifications)
    db.commit()

    return notifications


# app/utils/test_data.py (дополнение)
from app.models.budget import Budget, BudgetPeriodEnum
from datetime import date
from calendar import monthrange


async def create_test_budgets(user_id: int, db: Session, year: int = 2023, month: int = 9):
    """Создание тестовых бюджетов для пользователя"""
    from app.models.category import BudgetCategory, CategoryTypeEnum

    # Получаем категории расходов пользователя
    expense_categories = db.query(BudgetCategory).filter(
        BudgetCategory.user_id == user_id,
        BudgetCategory.category_type == CategoryTypeEnum.EXPENSE
    ).all()

    if not expense_categories:
        return []

    # Определяем период (указанный месяц)
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)

    # Предопределенные суммы бюджетов
    budget_amounts = {
        "Housing": 1200,
        "Food & Dining": 650,
        "Transportation": 400,
        "Shopping": 300,
        "Entertainment": 200,
        "Health Care": 150,
        "Bills": 100,
        "Travel": 80,
        "Subscription": 50
    }

    budgets = []

    for category in expense_categories:
        # Определяем сумму бюджета
        amount = budget_amounts.get(category.name, 100)

        budget = Budget(
            user_id=user_id,
            category_id=category.id,
            amount=amount,
            period=BudgetPeriodEnum.MONTHLY,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )

        budgets.append(budget)

    # Добавляем все бюджеты в базу данных
    db.add_all(budgets)
    db.commit()

    # Обновляем объекты из БД
    for budget in budgets:
        db.refresh(budget)

    return budgets
