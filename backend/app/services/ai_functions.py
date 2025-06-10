from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.services.transaction import TransactionService
from app.services.budget import BudgetService
from app.services.profile import ProfileService


class AIFunctions:
    """Функции, которые AI может вызывать"""

    @staticmethod
    async def get_recent_transactions(user_id: int, limit: int = 10, db: Session = None):
        """Получить последние транзакции"""
        transactions, _ = await TransactionService.get_transactions(
            user_id, None, 0, limit, db
        )

        return {
            "function": "get_recent_transactions",
            "data": [
                {
                    "date": t["transaction_date"].strftime("%Y-%m-%d"),
                    "amount": t["amount"],
                    "type": t["transaction_type"],
                    "description": t["description"],
                    "category": t["category_name"]
                }
                for t in transactions[:5]
            ]
        }

    @staticmethod
    async def get_budget_status(user_id: int, db: Session = None):
        """Получить статус бюджета"""
        from datetime import datetime
        now = datetime.now()
        overview = await BudgetService.get_monthly_budget_overview(
            user_id, now.year, now.month, db
        )

        return {
            "function": "get_budget_status",
            "data": {
                "total_budget": overview["total_budget"],
                "spent": overview["spent"],
                "remaining": overview["remaining"],
                "usage_percentage": overview["usage_percentage"],
                "categories_count": len(overview["budgets_by_category"])
            }
        }

    @staticmethod
    async def get_spending_insights(user_id: int, db: Session = None):
        """Получить инсайты по тратам"""
        from app.services.report import ReportsService
        insights = await ReportsService.get_financial_insights(user_id, db)

        return {
            "function": "get_spending_insights",
            "data": [
                {
                    "title": insight.title,
                    "message": insight.message,
                    "type": insight.type
                }
                for insight in insights[:3]
            ]
        }


# Определение инструментов для OpenAI (новый формат)
AVAILABLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_recent_transactions",
            "description": "Get user's recent transactions",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of transactions to retrieve (max 10)",
                        "default": 5
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_budget_status",
            "description": "Get current budget status and usage",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_spending_insights",
            "description": "Get AI-generated insights about spending patterns",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]