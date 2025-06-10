from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatSessionWithMessages(ChatSessionResponse):
    messages: List[ChatMessageResponse]


class FinancialContext(BaseModel):
    """Контекст пользователя для AI"""
    balance: float
    recent_transactions: List[Dict[str, Any]]
    budget_status: Dict[str, Any]
    spending_categories: List[Dict[str, Any]]