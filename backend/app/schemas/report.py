# app/schemas/reports.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum


class ReportTypeEnum(str, Enum):
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_SUMMARY = "monthly_summary"
    QUARTERLY_SUMMARY = "quarterly_summary"
    YEARLY_SUMMARY = "yearly_summary"
    CUSTOM_PERIOD = "custom_period"
    TRANSACTION_DETAILS = "transaction_details"
    BUDGET_ANALYSIS = "budget_analysis"
    CATEGORY_BREAKDOWN = "category_breakdown"


class ExportFormatEnum(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"


# Схемы для данных графиков
class IncomeVsExpensesDataPoint(BaseModel):
    date: date
    income: float
    expenses: float
    net: float


class IncomeVsExpensesChart(BaseModel):
    period: str
    data_points: List[IncomeVsExpensesDataPoint]
    total_income: float
    total_expenses: float
    net_balance: float


class SpendingCategoryData(BaseModel):
    category_id: int
    category_name: str
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    amount: float
    percentage: float
    transaction_count: int


class WeeklyTrendDataPoint(BaseModel):
    week_start: date
    week_end: date
    total_expenses: float
    week_number: int


class WeeklyTrendData(BaseModel):
    weeks: List[WeeklyTrendDataPoint]
    average_weekly_spending: float
    trend_percentage: float  # Изменение относительно предыдущего периода


class InsightData(BaseModel):
    title: str
    message: str
    type: str  # "positive", "warning", "info", "alert"
    icon: str
    action_url: Optional[str] = None


# Основная схема финансового отчета
class FinancialReportSummary(BaseModel):
    # Период отчета
    period_name: str
    start_date: date
    end_date: date

    # Основные показатели
    income: float
    expenses: float
    net_balance: float
    savings: float
    savings_rate: float  # В процентах

    # Статус бюджета
    budget_total: float
    budget_used: float
    budget_percentage: float
    budget_remaining: float

    # Данные для графиков
    income_vs_expenses_chart: IncomeVsExpensesChart
    spending_categories: List[SpendingCategoryData]
    weekly_trend: WeeklyTrendData

    # Инсайты
    insights: List[InsightData]

    # Дополнительная статистика
    transaction_count: int
    average_transaction_amount: float
    largest_expense: Dict[str, Any]  # {"amount": 500, "description": "Rent", "category": "Housing"}
    most_spending_category: str


# Схемы для экспорта
class ExportOptions(BaseModel):
    include_charts: bool = True
    include_transaction_details: bool = True
    include_categories_summary: bool = True
    include_budget_analysis: bool = True
    include_insights: bool = True


class ExportReportRequest(BaseModel):
    report_type: ReportTypeEnum
    format: ExportFormatEnum
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    options: ExportOptions = ExportOptions()


class ExportReportResponse(BaseModel):
    export_id: str
    status: str  # "processing", "completed", "failed"
    estimated_size: str  # "2.5 MB"
    download_url: Optional[str] = None
    expires_at: datetime


class ExportedReport(BaseModel):
    export_id: str
    report_type: ReportTypeEnum
    format: ExportFormatEnum
    file_name: str
    file_size: str
    created_at: datetime
    expires_at: datetime
    download_url: str
    status: str  # "completed", "expired", "processing"

    class Config:
        from_attributes = True


# Схемы для различных типов отчетов
class TransactionDetailReport(BaseModel):
    transactions: List[Dict[str, Any]]
    summary: Dict[str, float]
    categories_breakdown: List[SpendingCategoryData]


class BudgetAnalysisReport(BaseModel):
    budgets: List[Dict[str, Any]]
    overall_performance: Dict[str, float]
    recommendations: List[str]


class CategoryBreakdownReport(BaseModel):
    income_categories: List[SpendingCategoryData]
    expense_categories: List[SpendingCategoryData]
    category_trends: Dict[str, List[Dict[str, Any]]]