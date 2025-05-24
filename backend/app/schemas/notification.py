# app/schemas/notification.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from app.models.notification import NotificationTypeEnum, NotificationCategoryEnum


class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: NotificationTypeEnum
    category: NotificationCategoryEnum
    icon: Optional[str] = None
    is_actionable: bool = False
    action_url: Optional[str] = None
    transaction_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    relative_time: str  # Рассчитывается из created_at

    class Config:
        from_attributes = True


class NotificationGroupResponse(BaseModel):
    title: str  # "Today", "Yesterday", "Earlier This Week"
    notifications: List[NotificationResponse]


class NotificationSummary(BaseModel):
    total: int
    unread: int
    by_category: Dict[str, int]  # Количество уведомлений по категориям


class NotificationListResponse(BaseModel):
    groups: List[NotificationGroupResponse]
    summary: NotificationSummary