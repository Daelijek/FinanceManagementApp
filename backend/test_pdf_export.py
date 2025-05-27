# backend/test_pdf_export.py
"""
Скрипт для тестирования PDF экспорта
Запуск: python test_pdf_export.py
"""

import sys
import os
import asyncio
from datetime import datetime, date, timedelta

# Добавляем корневую директорию проекта в sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.export_generator import PDFReportGenerator
from app.schemas.report import (
    FinancialReportSummary, ExportOptions, 
    IncomeVsExpensesChart, IncomeVsExpensesDataPoint,
    SpendingCategoryData, WeeklyTrendData, WeeklyTrendDataPoint,
    InsightData
)


def create_test_report_data():
    """Создает тестовые данные для отчета"""
    
    # Создаем тестовые данные для графика доходы vs расходы
    today = date.today()
    data_points = []
    for i in range(7):  # Последние 7 дней
        day = today - timedelta(days=6-i)
        data_points.append(IncomeVsExpensesDataPoint(
            date=day,
            income=500 + i * 100,
            expenses=300 + i * 50,
            net=200 + i * 50
        ))
    
    income_vs_expenses_chart = IncomeVsExpensesChart(
        period="day",
        data_points=data_points,
        total_income=4200,
        total_expenses=2450,
        net_balance=1750
    )
    
    # Создаем тестовые данные по категориям
    spending_categories = [
        SpendingCategoryData(
            category_id=1,
            category_name="Food & Dining",
            category_icon="restaurant",
            category_color="#FF9800",
            amount=850.50,
            percentage=34.7,
            transaction_count=25
        ),
        SpendingCategoryData(
            category_id=2,
            category_name="Transportation",
            category_icon="car",
            category_color="#2196F3",
            amount=420.00,
            percentage=17.1,
            transaction_count=12
        ),
        SpendingCategoryData(
            category_id=3,
            category_name="Shopping",
            category_icon="shopping-cart",
            category_color="#4CAF50",
            amount=380.75,
            percentage=15.6,
            transaction_count=8
        ),
        SpendingCategoryData(
            category_id=4,
            category_name="Entertainment",
            category_icon="movie",
            category_color="#9C27B0",
            amount=295.25,
            percentage=12.1,
            transaction_count=15
        ),
        SpendingCategoryData(
            category_id=5,
            category_name="Bills & Utilities",
            category_icon="receipt",
            category_color="#607D8B",
            amount=503.50,
            percentage=20.5,
            transaction_count=6
        )
    ]
    
    # Создаем недельный тренд
    weeks = []
    for i in range(4):
        week_start = today - timedelta(weeks=3-i, days=today.weekday())
        week_end = week_start + timedelta(days=6)
        weeks.append(WeeklyTrendDataPoint(
            week_start=week_start,
            week_end=week_end,
            total_expenses=600 + i * 50,
            week_number=i + 1
        ))
    
    weekly_trend = WeeklyTrendData(
        weeks=weeks,
        average_weekly_spending=625.0,
        trend_percentage=8.3
    )
    
    # Создаем инсайты
    insights = [
        InsightData(
            title="Improved Savings",
            message="Your savings rate has improved by 15.4% since last month.",
            type="positive",
            icon="trending-up"
        ),
        InsightData(
            title="High Food Expenses",
            message="Food expenses are 12% higher than your average.",
            type="warning",
            icon="restaurant"
        ),
        InsightData(
            title="Budget Alert",
            message="Used 85% of your monthly budget. Consider reducing expenses.",
            type="alert",
            icon="warning"
        )
    ]
    
    # Создаем основной отчет
    report_data = FinancialReportSummary(
        period_name="November 2024",
        start_date=date(2024, 11, 1),
        end_date=date(2024, 11, 30),
        income=4200.00,
        expenses=2450.00,
        net_balance=1750.00,
        savings=5800.00,
        savings_rate=41.7,
        budget_total=3000.00,
        budget_used=2450.00,
        budget_percentage=81.7,
        budget_remaining=550.00,
        income_vs_expenses_chart=income_vs_expenses_chart,
        spending_categories=spending_categories,
        weekly_trend=weekly_trend,
        insights=insights,
        transaction_count=66,
        average_transaction_amount=37.12,
        largest_expense={"amount": 125.75, "description": "Grocery Shopping", "category": "Food & Dining"},
        most_spending_category="Food & Dining"
    )
    
    return report_data


async def test_pdf_generation():
    """Тестирует генерацию PDF файла"""
    print("🧪 Testing PDF Export Generation...")
    
    # Создаем тестовые данные
    report_data = create_test_report_data()
    print("✅ Test data created")
    
    # Настройки экспорта
    export_options = ExportOptions(
        include_charts=True,
        include_transaction_details=True,
        include_categories_summary=True,
        include_budget_analysis=True,
        include_insights=True
    )
    print("✅ Export options configured")
    
    # Создаем директорию для тестовых файлов
    test_dir = "test_exports"
    os.makedirs(test_dir, exist_ok=True)
    print(f"✅ Test directory created: {test_dir}")
    
    # Генерируем PDF
    export_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    try:
        file_path = await PDFReportGenerator.generate(
            report_data=report_data,
            options=export_options,
            export_dir=test_dir,
            export_id=export_id
        )
        
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"✅ PDF generated successfully!")
            print(f"   📄 File: {file_path}")
            print(f"   📏 Size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)")
            
            # Проверяем содержимое файла
            if file_size > 0:
                print("✅ File is not empty")
                
                # Попробуем открыть файл для проверки
                try:
                    with open(file_path, 'rb') as f:
                        header = f.read(4)
                        if header == b'%PDF':
                            print("✅ File appears to be a valid PDF")
                        else:
                            print("❌ File does not appear to be a valid PDF")
                except Exception as e:
                    print(f"❌ Error reading file: {e}")
                    
            else:
                print("❌ File is empty")
                
        else:
            print("❌ PDF file was not created")
            
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()


async def test_csv_generation():
    """Тестирует генерацию CSV файла"""
    print("\n🧪 Testing CSV Export Generation...")
    
    from app.services.export_generator import CSVReportGenerator
    
    # Создаем тестовые данные
    report_data = create_test_report_data()
    
    # Настройки экспорта
    export_options = ExportOptions(
        include_charts=True,
        include_transaction_details=True,
        include_categories_summary=True,
        include_budget_analysis=True,
        include_insights=True
    )
    
    # Создаем директорию для тестовых файлов
    test_dir = "test_exports"
    os.makedirs(test_dir, exist_ok=True)
    
    # Генерируем CSV
    export_id = f"test_csv_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    try:
        file_path = await CSVReportGenerator.generate(
            report_data=report_data,
            options=export_options,
            export_dir=test_dir,
            export_id=export_id
        )
        
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"✅ CSV generated successfully!")
            print(f"   📄 File: {file_path}")
            print(f"   📏 Size: {file_size:,} bytes")
            
            if file_size > 0:
                print("✅ File is not empty")
                
                # Проверяем первые строки файла
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        first_lines = [f.readline().strip() for _ in range(3)]
                        print("✅ First 3 lines of CSV:")
                        for i, line in enumerate(first_lines, 1):
                            print(f"   {i}: {line}")
                except Exception as e:
                    print(f"❌ Error reading CSV file: {e}")
            else:
                print("❌ File is empty")
                
        else:
            print("❌ CSV file was not created")
            
    except Exception as e:
        print(f"❌ Error generating CSV: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Основная функция тестирования"""
    print("🚀 Starting PDF Export Tests")
    print("=" * 50)
    
    await test_pdf_generation()
    await test_csv_generation()
    
    print("\n" + "=" * 50)
    print("🏁 Tests completed!")
    print("\nТестовые файлы сохранены в директории 'test_exports'")
    print("Вы можете проверить их вручную, чтобы убедиться в корректности генерации.")


if __name__ == "__main__":
    asyncio.run(main())