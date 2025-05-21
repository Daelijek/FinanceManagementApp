# app/api/v1/notifications.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_active_user
from app.services.notification import NotificationService
from app.schemas.notification import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    NotificationGroupResponse, NotificationSummary, NotificationListResponse
)
from app.models.notification import NotificationCategoryEnum, NotificationTypeEnum
from app.utils.test_data import create_test_notifications

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
        category: Optional[NotificationCategoryEnum] = Query(None),
        limit: int = 50,
        skip: int = 0,
        include_read: bool = False,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить уведомления пользователя с группировкой по дате"""
    groups, summary = await NotificationService.get_notifications(
        current_user.id,
        category,
        limit,
        skip,
        include_read,
        db
    )

    return NotificationListResponse(
        groups=groups,
        summary=summary
    )


@router.get("/summary", response_model=NotificationSummary)
async def get_notifications_summary(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить сводку по уведомлениям"""
    summary = await NotificationService._get_notification_summary(current_user.id, db)
    return summary


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
        notification_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить уведомление по ID"""
    notification = await NotificationService.get_notification(notification_id, current_user.id, db)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Добавляем относительное время
    result = notification.__dict__.copy()
    result["relative_time"] = NotificationService._get_relative_time(notification.created_at)

    return result


@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
        notification_id: int,
        notification_data: NotificationUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить уведомление (пометить как прочитанное)"""
    notification = await NotificationService.update_notification(
        notification_id,
        current_user.id,
        notification_data,
        db
    )

    # Добавляем относительное время
    result = notification.__dict__.copy()
    result["relative_time"] = NotificationService._get_relative_time(notification.created_at)

    return result


@router.delete("/{notification_id}")
async def delete_notification(
        notification_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить уведомление"""
    await NotificationService.delete_notification(notification_id, current_user.id, db)
    return {"message": "Notification successfully deleted"}


@router.post("/mark-all-read")
async def mark_all_as_read(
        category: Optional[NotificationCategoryEnum] = None,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Пометить все уведомления как прочитанные"""
    count = await NotificationService.mark_all_as_read(current_user.id, category, db)
    return {"message": f"{count} notifications marked as read"}


@router.post("/test", response_model=NotificationResponse)
async def create_test_notification(
        notification_type: NotificationTypeEnum,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Создать тестовое уведомление (только для разработки)"""
    # Определяем категорию на основе типа
    category_map = {
        NotificationTypeEnum.LARGE_TRANSACTION: NotificationCategoryEnum.TRANSACTIONS,
        NotificationTypeEnum.UPCOMING_BILL: NotificationCategoryEnum.BILLS,
        NotificationTypeEnum.NEW_DEVICE_LOGIN: NotificationCategoryEnum.SECURITY,
        NotificationTypeEnum.SECURITY_ALERT: NotificationCategoryEnum.SECURITY,
        NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: NotificationCategoryEnum.BUDGET,
        NotificationTypeEnum.WEEKLY_SUMMARY: NotificationCategoryEnum.ALL,
        NotificationTypeEnum.SUBSCRIPTION_RENEWAL: NotificationCategoryEnum.BILLS
    }

    # Определяем заголовок и сообщение на основе типа
    title_message_map = {
        NotificationTypeEnum.LARGE_TRANSACTION: ("Large Transaction Detected", "$500 spent at Amazon"),
        NotificationTypeEnum.UPCOMING_BILL: ("Upcoming Bill Payment", "Electric Bill due in 2 days"),
        NotificationTypeEnum.NEW_DEVICE_LOGIN: ("New Device Login", "Login from iPhone 14"),
        NotificationTypeEnum.SECURITY_ALERT: ("Suspicious Activity", "Password change attempt detected"),
        NotificationTypeEnum.BUDGET_GOAL_ACHIEVED: ("Budget Goal Achieved", "Savings goal reached"),
        NotificationTypeEnum.WEEKLY_SUMMARY: ("Weekly Spending Summary", "Your spending is on track"),
        NotificationTypeEnum.SUBSCRIPTION_RENEWAL: ("Subscription Renewal", "Netflix subscription will renew tomorrow")
    }

    title, message = title_message_map.get(notification_type, ("Notification", "Test notification message"))

    # Создаем тестовое уведомление
    notification_data = NotificationCreate(
        user_id=current_user.id,
        title=title,
        message=message,
        notification_type=notification_type,
        category=category_map.get(notification_type, NotificationCategoryEnum.ALL)
    )

    notification = await NotificationService.create_notification(notification_data, db)

    # Добавляем относительное время
    result = notification.__dict__.copy()
    result["relative_time"] = NotificationService._get_relative_time(notification.created_at)

    return result

@router.post("/generate-test-data", status_code=status.HTTP_201_CREATED)
async def generate_test_notifications(
    count: int = Query(10, description="Number of test notifications to generate"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Генерация тестовых уведомлений (только для разработки)"""
    notifications = await create_test_notifications(current_user.id, db, count)
    return {"message": f"Successfully generated {len(notifications)} test notifications"}

