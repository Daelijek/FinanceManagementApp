# app/services/reports.py
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, extract, text
from fastapi import HTTPException, status, BackgroundTasks
from datetime import datetime, date, timedelta
from calendar import monthrange
import uuid
import os
from app.models.transaction import Transaction
from app.models.category import BudgetCategory, CategoryTypeEnum
from app.models.budget import Budget
from app.models.export import ExportedReport as ExportModel
from app.schemas.report import (
    FinancialReportSummary, ExportReportRequest, ExportReportResponse,
    IncomeVsExpensesChart, IncomeVsExpensesDataPoint, SpendingCategoryData,
    WeeklyTrendData, WeeklyTrendDataPoint, InsightData, ExportedReport
)
from app.services.export_generator import PDFReportGenerator, CSVReportGenerator
from app.config import settings


class ReportsService:
    @staticmethod
    async def get_weekly_summary(user_id: int, db: Session) -> FinancialReportSummary:
        """Получить еженедельный финансовый отчет"""
        today = date.today()
        start_date = today - timedelta(days=today.weekday())  # Понедельник
        end_date = start_date + timedelta(days=6)  # Воскресенье

        return await ReportsService._generate_financial_summary(
            user_id, start_date, end_date, "This Week", db
        )

    @staticmethod
    async def get_monthly_summary(user_id: int, year: int, month: int, db: Session) -> FinancialReportSummary:
        """Получить месячный финансовый отчет"""
        start_date = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = date(year, month, last_day)

        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        period_name = f"{month_names[month - 1]} {year}"

        return await ReportsService._generate_financial_summary(
            user_id, start_date, end_date, period_name, db
        )

    @staticmethod
    async def _generate_financial_summary(
            user_id: int, start_date: date, end_date: date, period_name: str, db: Session
    ) -> FinancialReportSummary:
        """Генерация общего финансового отчета"""

        # Получаем основные финансовые показатели
        income = await ReportsService._get_total_by_type(
            user_id, CategoryTypeEnum.INCOME, start_date, end_date, db
        )
        expenses = await ReportsService._get_total_by_type(
            user_id, CategoryTypeEnum.EXPENSE, start_date, end_date, db
        )
        net_balance = income - expenses

        # Получаем сбережения из профиля
        from app.services.profile import ProfileService
        profile = await ProfileService.get_profile(user_id, db)
        financial_data = await ProfileService.get_financial_data(profile.id, db) if profile else None
        savings = financial_data.savings if financial_data else 0.0
        savings_rate = (net_balance / income * 100) if income > 0 else 0.0

        # Получаем данные о бюджете
        budget_data = await ReportsService._get_budget_summary(user_id, start_date, end_date, db)

        # Получаем данные для графиков
        income_vs_expenses_chart = await ReportsService.get_income_vs_expenses_chart(
            user_id, "day", (end_date - start_date).days + 1, db
        )

        spending_categories = await ReportsService.get_spending_by_categories(
            user_id, start_date, end_date, db
        )

        weekly_trend = await ReportsService.get_weekly_trend(user_id, 4, db)

        # Получаем инсайты
        insights = await ReportsService.get_financial_insights(user_id, db)

        # Дополнительная статистика
        transaction_stats = await ReportsService._get_transaction_stats(
            user_id, start_date, end_date, db
        )

        return FinancialReportSummary(
            period_name=period_name,
            start_date=start_date,
            end_date=end_date,
            income=income,
            expenses=expenses,
            net_balance=net_balance,
            savings=savings,
            savings_rate=round(savings_rate, 2),
            budget_total=budget_data["total"],
            budget_used=budget_data["used"],
            budget_percentage=budget_data["percentage"],
            budget_remaining=budget_data["remaining"],
            income_vs_expenses_chart=income_vs_expenses_chart,
            spending_categories=spending_categories,
            weekly_trend=weekly_trend,
            insights=insights,
            transaction_count=transaction_stats["count"],
            average_transaction_amount=transaction_stats["average"],
            largest_expense=transaction_stats["largest_expense"],
            most_spending_category=transaction_stats["most_spending_category"]
        )

    @staticmethod
    async def get_income_vs_expenses_chart(
            user_id: int, period: str, days: int, db: Session
    ) -> IncomeVsExpensesChart:
        """Получить данные для графика доходы vs расходы"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        data_points = []
        total_income = 0
        total_expenses = 0

        if period == "day":
            # Данные по дням
            current_date = start_date
            while current_date <= end_date:
                day_income = await ReportsService._get_total_by_type(
                    user_id, CategoryTypeEnum.INCOME, current_date, current_date, db
                )
                day_expenses = await ReportsService._get_total_by_type(
                    user_id, CategoryTypeEnum.EXPENSE, current_date, current_date, db
                )

                data_points.append(IncomeVsExpensesDataPoint(
                    date=current_date,
                    income=day_income,
                    expenses=day_expenses,
                    net=day_income - day_expenses
                ))

                total_income += day_income
                total_expenses += day_expenses
                current_date += timedelta(days=1)

        elif period == "week":
            # Данные по неделям
            current_date = start_date
            while current_date <= end_date:
                week_end = min(current_date + timedelta(days=6), end_date)

                week_income = await ReportsService._get_total_by_type(
                    user_id, CategoryTypeEnum.INCOME, current_date, week_end, db
                )
                week_expenses = await ReportsService._get_total_by_type(
                    user_id, CategoryTypeEnum.EXPENSE, current_date, week_end, db
                )

                data_points.append(IncomeVsExpensesDataPoint(
                    date=current_date,
                    income=week_income,
                    expenses=week_expenses,
                    net=week_income - week_expenses
                ))

                total_income += week_income
                total_expenses += week_expenses
                current_date += timedelta(days=7)

        return IncomeVsExpensesChart(
            period=period,
            data_points=data_points,
            total_income=total_income,
            total_expenses=total_expenses,
            net_balance=total_income - total_expenses
        )

    @staticmethod
    async def get_spending_by_categories(
            user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None, db: Session = None
    ) -> List[SpendingCategoryData]:
        """Получить расходы по категориям"""
        if start_date is None:
            start_date = date.today() - timedelta(days=30)
        if end_date is None:
            end_date = date.today()

        # Запрос расходов по категориям
        query = db.query(
            BudgetCategory.id,
            BudgetCategory.name,
            BudgetCategory.icon,
            BudgetCategory.color,
            func.sum(Transaction.amount).label("total_amount"),
            func.count(Transaction.id).label("transaction_count")
        ).join(
            Transaction, BudgetCategory.id == Transaction.category_id
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).group_by(
            BudgetCategory.id, BudgetCategory.name, BudgetCategory.icon, BudgetCategory.color
        ).order_by(desc("total_amount"))

        results = query.all()

        # Вычисляем общую сумму для процентов
        total_amount = sum(result.total_amount for result in results)

        categories_data = []
        for result in results:
            percentage = (result.total_amount / total_amount * 100) if total_amount > 0 else 0

            categories_data.append(SpendingCategoryData(
                category_id=result.id,
                category_name=result.name,
                category_icon=result.icon,
                category_color=result.color,
                amount=result.total_amount,
                percentage=round(percentage, 1),
                transaction_count=result.transaction_count
            ))

        return categories_data

    @staticmethod
    async def get_weekly_trend(user_id: int, weeks_count: int, db: Session) -> WeeklyTrendData:
        """Получить данные недельного тренда"""
        today = date.today()
        weeks = []

        for i in range(weeks_count):
            # Вычисляем начало недели (понедельник)
            week_start = today - timedelta(days=today.weekday() + (i * 7))
            week_end = week_start + timedelta(days=6)

            # Если это будущая неделя, пропускаем
            if week_start > today:
                continue

            # Корректируем конец недели, если он в будущем
            if week_end > today:
                week_end = today

            week_expenses = await ReportsService._get_total_by_type(
                user_id, CategoryTypeEnum.EXPENSE, week_start, week_end, db
            )

            weeks.append(WeeklyTrendDataPoint(
                week_start=week_start,
                week_end=week_end,
                total_expenses=week_expenses,
                week_number=i + 1
            ))

        # Сортируем по дате (старые недели сначала)
        weeks.sort(key=lambda x: x.week_start)

        # Вычисляем среднее и тренд
        average_spending = sum(week.total_expenses for week in weeks) / len(weeks) if weeks else 0

        # Тренд: сравнение последней недели с предыдущей
        trend_percentage = 0
        if len(weeks) >= 2:
            last_week = weeks[-1].total_expenses
            prev_week = weeks[-2].total_expenses
            if prev_week > 0:
                trend_percentage = ((last_week - prev_week) / prev_week) * 100

        return WeeklyTrendData(
            weeks=weeks,
            average_weekly_spending=round(average_spending, 2),
            trend_percentage=round(trend_percentage, 1)
        )

    @staticmethod
    async def get_financial_insights(user_id: int, db: Session) -> List[InsightData]:
        """Получить финансовые инсайты"""
        insights = []

        # Анализ сбережений
        from app.services.profile import ProfileService
        profile = await ProfileService.get_profile(user_id, db)
        if profile:
            financial_data = await ProfileService.get_financial_data(profile.id, db)
            if financial_data and financial_data.savings > 0:
                # Пример инсайта о росте сбережений
                savings_growth = 23.4  # Здесь нужна логика расчета роста
                insights.append(InsightData(
                    title="Improved Savings",
                    message=f"Your savings rate has improved by {savings_growth}% since last week.",
                    type="positive",
                    icon="trending-up",
                    action_url="/profile/financial"
                ))

        # Анализ расходов по категориям
        today = date.today()
        last_month_start = today.replace(day=1) - timedelta(days=1)
        last_month_start = last_month_start.replace(day=1)
        last_month_end = today.replace(day=1) - timedelta(days=1)

        # Пример: высокие расходы на еду
        food_category = db.query(BudgetCategory).filter(
            BudgetCategory.user_id == user_id,
            BudgetCategory.name.ilike('%food%')
        ).first()

        if food_category:
            current_food_expenses = await ReportsService._get_category_expenses(
                user_id, food_category.id, today - timedelta(days=30), today, db
            )

            if current_food_expenses > 500:  # Пример порога
                insights.append(InsightData(
                    title="High Food Expenses",
                    message="Food expenses are 15% higher than your average.",
                    type="warning",
                    icon="restaurant",
                    action_url=f"/categories/{food_category.id}"
                ))

        # Анализ бюджета
        budget_data = await ReportsService._get_budget_summary(user_id, today.replace(day=1), today, db)
        if budget_data["percentage"] > 80:
            insights.append(InsightData(
                title="Budget Alert",
                message=f"Used {budget_data['percentage']:.0f}% of your monthly budget. Consider reducing expenses.",
                type="alert",
                icon="warning",
                action_url="/budgets/current-month"
            ))

        return insights

    @staticmethod
    async def export_report(
            user_id: int, export_request: ExportReportRequest,
            background_tasks: BackgroundTasks, db: Session
    ) -> ExportReportResponse:
        """Экспорт финансового отчета"""
        export_id = str(uuid.uuid4())

        # Создаем запись об экспорте
        export_record = ExportModel(
            export_id=export_id,
            user_id=user_id,
            report_type=export_request.report_type,
            format=export_request.format,
            status="processing",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )

        db.add(export_record)
        db.commit()

        # Добавляем задачу в фон
        background_tasks.add_task(
            ReportsService._generate_export_file,
            export_id, user_id, export_request, db
        )

        return ExportReportResponse(
            export_id=export_id,
            status="processing",
            estimated_size="2.5 MB",
            expires_at=export_record.expires_at
        )

    @staticmethod
    async def _generate_export_file(
            export_id: str, user_id: int, export_request: ExportReportRequest, db: Session
    ):
        """Генерация файла экспорта (фоновая задача)"""
        import logging
        
        logger = logging.getLogger(__name__)
        logger.info(f"Starting export generation for ID: {export_id}")
        
        try:
            # Получаем данные для отчета
            if export_request.report_type == "monthly_summary":
                if export_request.start_date and export_request.end_date:
                    start_date = export_request.start_date
                    end_date = export_request.end_date
                else:
                    # Текущий месяц
                    today = date.today()
                    start_date = date(today.year, today.month, 1)
                    end_date = today

                report_data = await ReportsService._generate_financial_summary(
                    user_id, start_date, end_date, f"Monthly Summary ({start_date.strftime('%B %Y')})", db
                )
            elif export_request.report_type == "weekly_summary":
                report_data = await ReportsService.get_weekly_summary(user_id, db)
            elif export_request.report_type == "custom_period":
                if not export_request.start_date or not export_request.end_date:
                    raise ValueError("Start date and end date are required for custom period reports")
                report_data = await ReportsService._generate_financial_summary(
                    user_id, export_request.start_date, export_request.end_date, 
                    f"Custom Period ({export_request.start_date} - {export_request.end_date})", db
                )
            else:
                # Другие типы отчетов - используем месячный отчет как базу
                report_data = await ReportsService.get_monthly_summary(user_id, date.today().year, date.today().month, db)

            logger.info(f"Report data generated successfully for export {export_id}")

            # Генерируем файл
            export_dir = f"{settings.UPLOAD_DIR}/exports/{user_id}"
            os.makedirs(export_dir, exist_ok=True)
            logger.info(f"Export directory created: {export_dir}")

            file_path = None
            if export_request.format == "pdf":
                from app.services.export_generator import PDFReportGenerator
                file_path = await PDFReportGenerator.generate(
                    report_data, export_request.options, export_dir, export_id
                )
            elif export_request.format == "csv":
                from app.services.export_generator import CSVReportGenerator
                file_path = await CSVReportGenerator.generate(
                    report_data, export_request.options, export_dir, export_id
                )
            elif export_request.format == "excel":
                from app.services.export_generator import ExcelReportGenerator
                file_path = await ExcelReportGenerator.generate(
                    report_data, export_request.options, export_dir, export_id
                )
            else:
                raise ValueError(f"Unsupported export format: {export_request.format}")

            if not file_path or not os.path.exists(file_path):
                raise Exception(f"Failed to generate export file: {file_path}")

            file_size = os.path.getsize(file_path)
            logger.info(f"Export file generated successfully: {file_path}, size: {file_size} bytes")

            # Обновляем статус экспорта
            export_record = db.query(ExportModel).filter(
                ExportModel.export_id == export_id
            ).first()

            if export_record:
                export_record.status = "completed"
                export_record.file_path = file_path
                export_record.file_size = ReportsService._get_file_size(file_path)
                db.commit()
                logger.info(f"Export record updated successfully for ID: {export_id}")
            else:
                logger.error(f"Export record not found for ID: {export_id}")

        except Exception as e:
            logger.error(f"Error generating export {export_id}: {str(e)}", exc_info=True)
            
            # Обновляем статус на failed
            try:
                export_record = db.query(ExportModel).filter(
                    ExportModel.export_id == export_id
                ).first()

                if export_record:
                    export_record.status = "failed"
                    export_record.error_message = str(e)
                    db.commit()
                    logger.info(f"Export status updated to failed for ID: {export_id}")
            except Exception as db_error:
                logger.error(f"Failed to update export status: {str(db_error)}")

    @staticmethod
    async def get_recent_exports(user_id: int, limit: int, db: Session) -> List[ExportedReport]:
        """Получить список последних экспортов"""
        exports = db.query(ExportModel).filter(
            ExportModel.user_id == user_id
        ).order_by(desc(ExportModel.created_at)).limit(limit).all()

        result = []
        for export in exports:
            result.append(ExportedReport(
                export_id=export.export_id,
                report_type=export.report_type,
                format=export.format,
                file_name=f"{export.report_type}_{export.created_at.strftime('%Y%m%d')}.{export.format}",
                file_size=export.file_size or "Unknown",
                created_at=export.created_at,
                expires_at=export.expires_at,
                download_url=f"/api/v1/reports/export/{export.export_id}/download",
                status=export.status
            ))

        return result

    @staticmethod
    async def get_export_file_path(export_id: str, user_id: int, db: Session) -> Optional[str]:
        """Получить путь к файлу экспорта"""
        export_record = db.query(ExportModel).filter(
            ExportModel.export_id == export_id,
            ExportModel.user_id == user_id,
            ExportModel.status == "completed",
            ExportModel.expires_at > datetime.utcnow()
        ).first()

        if export_record and export_record.file_path and os.path.exists(export_record.file_path):
            return export_record.file_path

        return None

    @staticmethod
    async def delete_export(export_id: str, user_id: int, db: Session) -> None:
        """Удалить экспорт"""
        export_record = db.query(ExportModel).filter(
            ExportModel.export_id == export_id,
            ExportModel.user_id == user_id
        ).first()

        if not export_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export not found"
            )

        # Удаляем файл
        if export_record.file_path and os.path.exists(export_record.file_path):
            os.remove(export_record.file_path)

        # Удаляем запись
        db.delete(export_record)
        db.commit()

    # Вспомогательные методы
    @staticmethod
    async def _get_total_by_type(
            user_id: int, transaction_type: CategoryTypeEnum,
            start_date: date, end_date: date, db: Session
    ) -> float:
        """Получить общую сумму по типу транзакции за период"""
        total = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == transaction_type,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).scalar()

        return total or 0.0

    @staticmethod
    async def _get_category_expenses(
            user_id: int, category_id: int, start_date: date, end_date: date, db: Session
    ) -> float:
        """Получить расходы по категории за период"""
        total = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).scalar()

        return total or 0.0

    @staticmethod
    async def _get_budget_summary(user_id: int, start_date: date, end_date: date, db: Session) -> Dict[str, float]:
        """Получить сводку по бюджету"""
        # Получаем активные бюджеты за период
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.is_active == True,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date
        ).all()

        total_budget = sum(budget.amount for budget in budgets)
        total_used = 0

        for budget in budgets:
            # Рассчитываем пересечение периодов
            actual_start = max(budget.start_date, start_date)
            actual_end = min(budget.end_date, end_date)

            spent = await ReportsService._get_category_expenses(
                user_id, budget.category_id, actual_start, actual_end, db
            )
            total_used += spent

        percentage = (total_used / total_budget * 100) if total_budget > 0 else 0

        return {
            "total": total_budget,
            "used": total_used,
            "percentage": round(percentage, 1),
            "remaining": max(0, total_budget - total_used)
        }

    @staticmethod
    async def _get_transaction_stats(
            user_id: int, start_date: date, end_date: date, db: Session
    ) -> Dict[str, Any]:
        """Получить статистику по транзакциям"""
        # Общее количество транзакций
        count = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).scalar() or 0

        # Средняя сумма транзакции
        avg_amount = db.query(func.avg(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).scalar() or 0

        # Самая крупная трата
        largest_expense = db.query(
            Transaction.amount,
            Transaction.description,
            BudgetCategory.name.label("category_name")
        ).outerjoin(
            BudgetCategory, Transaction.category_id == BudgetCategory.id
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).order_by(desc(Transaction.amount)).first()

        largest_expense_dict = {
            "amount": 0,
            "description": "No expenses",
            "category": "None"
        }

        if largest_expense:
            largest_expense_dict = {
                "amount": largest_expense.amount,
                "description": largest_expense.description or "No description",
                "category": largest_expense.category_name or "Uncategorized"
            }

        # Категория с наибольшими тратами
        most_spending = db.query(
            BudgetCategory.name,
            func.sum(Transaction.amount).label("total")
        ).join(
            Transaction, BudgetCategory.id == Transaction.category_id
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == CategoryTypeEnum.EXPENSE,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).group_by(BudgetCategory.name).order_by(desc("total")).first()

        most_spending_category = most_spending.name if most_spending else "No category"

        return {
            "count": count,
            "average": round(avg_amount, 2),
            "largest_expense": largest_expense_dict,
            "most_spending_category": most_spending_category
        }

    @staticmethod
    def _get_file_size(file_path: str) -> str:
        """Получить размер файла в читаемом формате"""
        try:
            size_bytes = os.path.getsize(file_path)
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                return f"{size_bytes / 1024:.1f} KB"
            else:
                return f"{size_bytes / (1024 * 1024):.1f} MB"
        except:
            return "Unknown"