# app/services/export_generator.py
from typing import Dict, Any
import os
import csv
from datetime import datetime
from app.schemas.report import FinancialReportSummary, ExportOptions


class PDFReportGenerator:
    @staticmethod
    async def generate(
            report_data: FinancialReportSummary,
            options: ExportOptions,
            export_dir: str,
            export_id: str
    ) -> str:
        """Генерация PDF отчета"""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.graphics.shapes import Drawing
            from reportlab.graphics.charts.piecharts import Pie
            from reportlab.graphics.charts.linecharts import HorizontalLineChart

        except ImportError:
            # Если reportlab не установлен, создаем простой текстовый файл
            return await PDFReportGenerator._generate_simple_text_report(
                report_data, options, export_dir, export_id
            )

        file_path = os.path.join(export_dir, f"financial_report_{export_id}.pdf")

        # Создаем PDF документ
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Заголовок
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Центрирование
        )

        story.append(Paragraph(f"Financial Report - {report_data.period_name}", title_style))
        story.append(Spacer(1, 20))

        # Основные показатели
        summary_data = [
            ['Metric', 'Amount'],
            ['Income', f"${report_data.income:,.2f}"],
            ['Expenses', f"${report_data.expenses:,.2f}"],
            ['Net Balance', f"${report_data.net_balance:,.2f}"],
            ['Savings', f"${report_data.savings:,.2f}"],
            ['Savings Rate', f"{report_data.savings_rate:.1f}%"],
        ]

        summary_table = Table(summary_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(Paragraph("Financial Summary", styles['Heading2']))
        story.append(summary_table)
        story.append(Spacer(1, 20))

        # Бюджет
        if options.include_budget_analysis:
            budget_data = [
                ['Budget Metric', 'Value'],
                ['Total Budget', f"${report_data.budget_total:,.2f}"],
                ['Used', f"${report_data.budget_used:,.2f}"],
                ['Remaining', f"${report_data.budget_remaining:,.2f}"],
                ['Usage', f"{report_data.budget_percentage:.1f}%"],
            ]

            budget_table = Table(budget_data)
            budget_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            story.append(Paragraph("Budget Analysis", styles['Heading2']))
            story.append(budget_table)
            story.append(Spacer(1, 20))

        # Категории расходов
        if options.include_categories_summary and report_data.spending_categories:
            story.append(Paragraph("Spending by Categories", styles['Heading2']))

            categories_data = [['Category', 'Amount', 'Percentage', 'Transactions']]
            for category in report_data.spending_categories[:10]:  # Топ 10
                categories_data.append([
                    category.category_name,
                    f"${category.amount:,.2f}",
                    f"{category.percentage:.1f}%",
                    str(category.transaction_count)
                ])

            categories_table = Table(categories_data)
            categories_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            story.append(categories_table)
            story.append(Spacer(1, 20))

        # Инсайты
        if options.include_insights and report_data.insights:
            story.append(Paragraph("Financial Insights", styles['Heading2']))

            for insight in report_data.insights:
                insight_text = f"<b>{insight.title}:</b> {insight.message}"
                story.append(Paragraph(insight_text, styles['Normal']))
                story.append(Spacer(1, 10))

        # Футер
        story.append(Spacer(1, 30))
        footer_text = f"Report generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
        story.append(Paragraph(footer_text, styles['Normal']))

        # Сохраняем PDF
        doc.build(story)

        return file_path

    @staticmethod
    async def _generate_simple_text_report(
            report_data: FinancialReportSummary,
            options: ExportOptions,
            export_dir: str,
            export_id: str
    ) -> str:
        """Генерация простого текстового отчета (если reportlab недоступен)"""
        file_path = os.path.join(export_dir, f"financial_report_{export_id}.txt")

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"FINANCIAL REPORT - {report_data.period_name}\n")
            f.write("=" * 50 + "\n\n")

            f.write("SUMMARY:\n")
            f.write(f"Income: ${report_data.income:,.2f}\n")
            f.write(f"Expenses: ${report_data.expenses:,.2f}\n")
            f.write(f"Net Balance: ${report_data.net_balance:,.2f}\n")
            f.write(f"Savings: ${report_data.savings:,.2f}\n")
            f.write(f"Savings Rate: {report_data.savings_rate:.1f}%\n\n")

            if options.include_budget_analysis:
                f.write("BUDGET ANALYSIS:\n")
                f.write(f"Total Budget: ${report_data.budget_total:,.2f}\n")
                f.write(f"Used: ${report_data.budget_used:,.2f} ({report_data.budget_percentage:.1f}%)\n")
                f.write(f"Remaining: ${report_data.budget_remaining:,.2f}\n\n")

            if options.include_categories_summary and report_data.spending_categories:
                f.write("SPENDING BY CATEGORIES:\n")
                for category in report_data.spending_categories:
                    f.write(f"{category.category_name}: ${category.amount:,.2f} ({category.percentage:.1f}%)\n")
                f.write("\n")

            if options.include_insights and report_data.insights:
                f.write("INSIGHTS:\n")
                for insight in report_data.insights:
                    f.write(f"• {insight.title}: {insight.message}\n")
                f.write("\n")

            f.write(f"Report generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n")

        return file_path


class CSVReportGenerator:
    @staticmethod
    async def generate(
            report_data: FinancialReportSummary,
            options: ExportOptions,
            export_dir: str,
            export_id: str
    ) -> str:
        """Генерация CSV отчета"""
        file_path = os.path.join(export_dir, f"financial_report_{export_id}.csv")

        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)

            # Заголовок
            writer.writerow([f"Financial Report - {report_data.period_name}"])
            writer.writerow([f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
            writer.writerow([])

            # Основные показатели
            writer.writerow(["FINANCIAL SUMMARY"])
            writer.writerow(["Metric", "Amount"])
            writer.writerow(["Income", f"{report_data.income:.2f}"])
            writer.writerow(["Expenses", f"{report_data.expenses:.2f}"])
            writer.writerow(["Net Balance", f"{report_data.net_balance:.2f}"])
            writer.writerow(["Savings", f"{report_data.savings:.2f}"])
            writer.writerow(["Savings Rate (%)", f"{report_data.savings_rate:.1f}"])
            writer.writerow([])

            # Бюджет
            if options.include_budget_analysis:
                writer.writerow(["BUDGET ANALYSIS"])
                writer.writerow(["Metric", "Amount"])
                writer.writerow(["Total Budget", f"{report_data.budget_total:.2f}"])
                writer.writerow(["Used", f"{report_data.budget_used:.2f}"])
                writer.writerow(["Remaining", f"{report_data.budget_remaining:.2f}"])
                writer.writerow(["Usage (%)", f"{report_data.budget_percentage:.1f}"])
                writer.writerow([])

            # Категории
            if options.include_categories_summary and report_data.spending_categories:
                writer.writerow(["SPENDING BY CATEGORIES"])
                writer.writerow(["Category", "Amount", "Percentage", "Transactions"])
                for category in report_data.spending_categories:
                    writer.writerow([
                        category.category_name,
                        f"{category.amount:.2f}",
                        f"{category.percentage:.1f}",
                        category.transaction_count
                    ])
                writer.writerow([])

            # Данные для графика доходы vs расходы
            if options.include_charts and report_data.income_vs_expenses_chart:
                writer.writerow(["INCOME VS EXPENSES DATA"])
                writer.writerow(["Date", "Income", "Expenses", "Net"])
                for point in report_data.income_vs_expenses_chart.data_points:
                    writer.writerow([
                        point.date.strftime('%Y-%m-%d'),
                        f"{point.income:.2f}",
                        f"{point.expenses:.2f}",
                        f"{point.net:.2f}"
                    ])
                writer.writerow([])

            # Недельный тренд
            if report_data.weekly_trend and report_data.weekly_trend.weeks:
                writer.writerow(["WEEKLY TREND"])
                writer.writerow(["Week Start", "Week End", "Expenses"])
                for week in report_data.weekly_trend.weeks:
                    writer.writerow([
                        week.week_start.strftime('%Y-%m-%d'),
                        week.week_end.strftime('%Y-%m-%d'),
                        f"{week.total_expenses:.2f}"
                    ])
                writer.writerow([])

            # Инсайты
            if options.include_insights and report_data.insights:
                writer.writerow(["FINANCIAL INSIGHTS"])
                writer.writerow(["Title", "Message", "Type"])
                for insight in report_data.insights:
                    writer.writerow([insight.title, insight.message, insight.type])

        return file_path


class ExcelReportGenerator:
    @staticmethod
    async def generate(
            report_data: FinancialReportSummary,
            options: ExportOptions,
            export_dir: str,
            export_id: str
    ) -> str:
        """Генерация Excel отчета"""
        try:
            import openpyxl
            from openpyxl.styles import Font, Alignment, PatternFill
            from openpyxl.chart import PieChart, LineChart, Reference
        except ImportError:
            # Если openpyxl не установлен, возвращаем CSV
            return await CSVReportGenerator.generate(report_data, options, export_dir, export_id)

        file_path = os.path.join(export_dir, f"financial_report_{export_id}.xlsx")

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Financial Report"

        # Стили
        header_font = Font(bold=True, size=14)
        title_font = Font(bold=True, size=16)

        row = 1

        # Заголовок
        ws.cell(row=row, column=1, value=f"Financial Report - {report_data.period_name}").font = title_font
        row += 2

        # Основные показатели
        ws.cell(row=row, column=1, value="Financial Summary").font = header_font
        row += 1

        summary_data = [
            ("Income", report_data.income),
            ("Expenses", report_data.expenses),
            ("Net Balance", report_data.net_balance),
            ("Savings", report_data.savings),
            ("Savings Rate (%)", report_data.savings_rate),
        ]

        for metric, value in summary_data:
            ws.cell(row=row, column=1, value=metric)
            ws.cell(row=row, column=2, value=value)
            row += 1

        row += 2

        # Категории расходов
        if options.include_categories_summary and report_data.spending_categories:
            ws.cell(row=row, column=1, value="Spending by Categories").font = header_font
            row += 1

            # Заголовки
            headers = ["Category", "Amount", "Percentage", "Transactions"]
            for col, header in enumerate(headers, 1):
                ws.cell(row=row, column=col, value=header).font = Font(bold=True)
            row += 1

            # Данные
            for category in report_data.spending_categories:
                ws.cell(row=row, column=1, value=category.category_name)
                ws.cell(row=row, column=2, value=category.amount)
                ws.cell(row=row, column=3, value=category.percentage)
                ws.cell(row=row, column=4, value=category.transaction_count)
                row += 1

        # Сохраняем файл
        wb.save(file_path)

        return file_path