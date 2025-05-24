# app/api/v1/reports.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_active_user
from app.services.report import ReportsService
from app.schemas.report import (
    FinancialReportSummary, ExportReportRequest, ExportReportResponse,
    ReportTypeEnum, ExportFormatEnum, ExportedReport, IncomeVsExpensesChart,
    SpendingCategoryData, WeeklyTrendData, InsightData
)

router = APIRouter(
    prefix="/reports",
    tags=["Financial Reports"]
)


@router.get("/weekly-summary", response_model=FinancialReportSummary)
async def get_weekly_financial_summary(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить полный еженедельный финансовый отчет"""
    report = await ReportsService.get_weekly_summary(current_user.id, db)
    return report


@router.get("/monthly-summary", response_model=FinancialReportSummary)
async def get_monthly_financial_summary(
        year: int = Query(None, description="Year, defaults to current year"),
        month: int = Query(None, ge=1, le=12, description="Month, defaults to current month"),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить полный месячный финансовый отчет"""
    now = datetime.now()
    if year is None:
        year = now.year
    if month is None:
        month = now.month

    report = await ReportsService.get_monthly_summary(current_user.id, year, month, db)
    return report


@router.get("/income-vs-expenses", response_model=IncomeVsExpensesChart)
async def get_income_vs_expenses_chart(
        period: str = Query("week", description="Period: day, week, month"),
        days: int = Query(30, description="Number of days for daily view"),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить данные для графика доходы vs расходы"""
    chart_data = await ReportsService.get_income_vs_expenses_chart(
        current_user.id, period, days, db
    )
    return chart_data


@router.get("/spending-categories", response_model=List[SpendingCategoryData])
async def get_spending_categories(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить данные расходов по категориям для круговой диаграммы"""
    categories_data = await ReportsService.get_spending_by_categories(
        current_user.id, start_date, end_date, db
    )
    return categories_data


@router.get("/weekly-trend", response_model=WeeklyTrendData)
async def get_weekly_trend(
        weeks_count: int = Query(4, ge=1, le=12, description="Number of weeks to show"),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить данные недельного тренда расходов"""
    trend_data = await ReportsService.get_weekly_trend(
        current_user.id, weeks_count, db
    )
    return trend_data


@router.get("/insights", response_model=List[InsightData])
async def get_financial_insights(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить финансовые инсайты и рекомендации"""
    insights = await ReportsService.get_financial_insights(current_user.id, db)
    return insights


@router.post("/export", response_model=ExportReportResponse)
async def export_financial_report(
        export_request: ExportReportRequest,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Экспорт финансового отчета"""
    export_result = await ReportsService.export_report(
        current_user.id, export_request, background_tasks, db
    )
    return export_result


@router.get("/export/{export_id}/download")
async def download_exported_report(
        export_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Скачать экспортированный отчет"""
    file_path = await ReportsService.get_export_file_path(
        export_id, current_user.id, db
    )

    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not found or expired"
        )

    return FileResponse(
        file_path,
        media_type='application/octet-stream',
        filename=f"financial_report_{export_id}.pdf"
    )


@router.get("/exports", response_model=List[ExportedReport])
async def get_recent_exports(
        limit: int = Query(10, le=50),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Получить список последних экспортированных отчетов"""
    exports = await ReportsService.get_recent_exports(current_user.id, limit, db)
    return exports


@router.delete("/exports/{export_id}")
async def delete_exported_report(
        export_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Удалить экспортированный отчет"""
    await ReportsService.delete_export(export_id, current_user.id, db)
    return {"message": "Export successfully deleted"}