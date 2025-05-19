# app/api/v1/transactions.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_active_user
from app.services.transaction import TransactionService
from app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransactionWithCategory, TransactionFilters, TransactionListResponse
)

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
        transaction_data: TransactionCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Создать новую транзакцию"""
    transaction = await TransactionService.create_transaction(current_user.id, transaction_data, db)
    return transaction


@router.get("/", response_model=TransactionListResponse)
async def get_transactions(
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        transaction_type: Optional[str] = None,
        category_id: Optional[List[int]] = Query(None),
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        payment_method: Optional[str] = None,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить список транзакций с фильтрацией"""
    filters = TransactionFilters(
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
        category_ids=category_id,
        min_amount=min_amount,
        max_amount=max_amount,
        payment_method=payment_method
    )

    transactions, summary = await TransactionService.get_transactions(
        current_user.id, filters, skip, limit, db
    )

    return TransactionListResponse(
        transactions=transactions,
        summary=summary
    )


@router.get("/period/{period}", response_model=TransactionListResponse)
async def get_transactions_by_period(
        period: str,
        date: Optional[date] = None,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить транзакции за определенный период (day, week, month, year)"""
    if period not in ["day", "week", "month", "year", "all"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid period. Must be one of: day, week, month, year, all"
        )

    transactions, summary = await TransactionService.get_transactions_by_period(
        current_user.id, period, date, db
    )

    return TransactionListResponse(
        transactions=transactions,
        summary=summary
    )


@router.get("/grouped", response_model=List[dict])
async def get_transactions_grouped(
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить транзакции, сгруппированные по датам (для SectionList)"""
    transactions, _ = await TransactionService.get_transactions(
        current_user.id, None, skip, limit, db
    )

    sections = await TransactionService.group_transactions_by_date(transactions)
    return sections


@router.get("/{transaction_id}", response_model=TransactionWithCategory)
async def get_transaction(
        transaction_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить транзакцию по ID"""
    transaction = await TransactionService.get_transaction(transaction_id, current_user.id, db)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
        transaction_id: int,
        transaction_data: TransactionUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Обновить транзакцию"""
    transaction = await TransactionService.update_transaction(
        transaction_id, current_user.id, transaction_data, db
    )
    return transaction


@router.delete("/{transaction_id}")
async def delete_transaction(
        transaction_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить транзакцию"""
    await TransactionService.delete_transaction(transaction_id, current_user.id, db)
    return {"message": "Transaction successfully deleted"}


@router.post("/{transaction_id}/receipt")
async def upload_receipt_photo(
        transaction_id: int,
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Загрузить фото чека"""
    photo_url = await TransactionService.upload_receipt_photo(
        transaction_id, current_user.id, file, db
    )
    return {"message": "Receipt photo uploaded successfully", "photo_url": photo_url}