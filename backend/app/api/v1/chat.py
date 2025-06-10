from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.utils.dependencies import get_current_active_user
from app.services.chat_service import ChatService
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse, ChatSessionWithMessages,
    ChatMessageCreate, ChatMessageResponse
)

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat Assistant"]
)

chat_service = ChatService()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
        session_data: ChatSessionCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Создать новую chat сессию"""
    session = await chat_service.create_session(
        current_user.id, session_data.title, db
    )
    return session


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить все chat сессии пользователя"""
    sessions = await chat_service.get_user_sessions(current_user.id, db)
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(
        session_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить chat сессию с сообщениями"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    return session


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
        session_id: int,
        message_data: ChatMessageCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Отправить сообщение в chat"""
    try:
        message = await chat_service.send_message(
            current_user.id, session_id, message_data.content, db
        )
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
        session_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить chat сессию"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    session.is_active = False
    db.commit()

    return {"message": "Session deleted successfully"}


@router.get("/sessions/{session_id}/suggestions", response_model=List[str])
async def get_chat_suggestions(
        session_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить предложенные вопросы для чата"""
    # Проверяем что сессия принадлежит пользователю
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    suggestions = await chat_service.get_suggested_prompts(current_user.id, db)
    return suggestions