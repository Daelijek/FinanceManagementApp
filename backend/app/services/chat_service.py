import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.chat import ChatSession, ChatMessage
from app.services.openai_service import OpenAIService
from app.services.ai_functions import AIFunctions, AVAILABLE_TOOLS
from app.services.profile import ProfileService


class ChatService:
    def __init__(self):
        self.openai_service = OpenAIService()

    async def create_session(self, user_id: int, title: str, db: Session) -> ChatSession:
        """Создать новую chat сессию"""
        session = ChatSession(user_id=user_id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    async def get_user_sessions(self, user_id: int, db: Session) -> List[ChatSession]:
        """Получить все сессии пользователя"""
        return db.query(ChatSession).filter(
            ChatSession.user_id == user_id,
            ChatSession.is_active == True
        ).order_by(ChatSession.updated_at.desc()).all()

    async def send_message(
            self,
            user_id: int,
            session_id: int,
            content: str,
            db: Session
    ) -> ChatMessage:
        """Отправить сообщение и получить ответ от AI"""

        # Проверяем сессию
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).first()

        if not session:
            raise ValueError("Session not found")

        # Сохраняем сообщение пользователя
        user_message = ChatMessage(
            session_id=session_id,
            role="user",
            content=content
        )
        db.add(user_message)

        # Получаем контекст пользователя
        user_context = await self._get_user_context(user_id, db)

        # Получаем историю сообщений
        message_history = await self._get_message_history(session_id, db)

        # Добавляем системный промпт
        messages = [
                       {
                           "role": "system",
                           "content": self.openai_service.create_system_prompt(user_context)
                       }
                   ] + message_history + [
                       {"role": "user", "content": content}
                   ]

        # Получаем ответ от OpenAI
        response = await self.openai_service.get_completion(
            messages=messages,
            tools=AVAILABLE_TOOLS
        )

        # Обрабатываем ответ
        ai_response = await self._process_ai_response(
            response, user_id, session_id, db
        )

        # Сохраняем ответ AI
        ai_message = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=ai_response["content"],
            function_call=ai_response.get("function_call")
        )
        db.add(ai_message)

        # Обновляем время сессии
        session.updated_at = func.now()

        db.commit()
        db.refresh(ai_message)

        return ai_message

    async def _get_user_context(self, user_id: int, db: Session) -> Dict[str, Any]:
        """Получить финансовый контекст пользователя"""
        profile = await ProfileService.get_profile(user_id, db)
        financial_data = await ProfileService.get_financial_data(profile.id, db) if profile else None

        # Получаем краткую статистику
        from app.services.budget import BudgetService
        from datetime import datetime

        now = datetime.now()
        try:
            budget_overview = await BudgetService.get_monthly_budget_overview(
                user_id, now.year, now.month, db
            )
        except:
            budget_overview = {"usage_percentage": 0, "total_budget": 0}

        return {
            "balance": financial_data.balance if financial_data else 0,
            "budget_percentage": budget_overview.get("usage_percentage", 0),
            "top_category": "Food",
        }

    async def _get_message_history(self, session_id: int, db: Session) -> List[Dict[str, str]]:
        """Получить историю сообщений (последние 10)"""
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()

        return [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(messages)
        ]

    async def _process_ai_response(
            self,
            response: Any,
            user_id: int,
            session_id: int,
            db: Session
    ) -> Dict[str, Any]:
        """Обработать ответ от AI и выполнить функции если нужно"""

        message = response.choices[0].message

        # Если AI хочет вызвать функцию (новый формат)
        if hasattr(message, 'tool_calls') and message.tool_calls:
            tool_call = message.tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # Выполняем функцию
            function_result = await self._execute_function(
                function_name, function_args, user_id, db
            )

            # Получаем финальный ответ с результатами функции
            final_messages = [
                {
                    "role": "system",
                    "content": self.openai_service.create_system_prompt(
                        await self._get_user_context(user_id, db)
                    )
                },
                {"role": "user", "content": "Based on this data, provide helpful financial advice:"},
                {"role": "assistant", "content": json.dumps(function_result)}
            ]

            final_response = await self.openai_service.get_completion(
                messages=final_messages
            )

            return {
                "content": final_response.choices[0].message.content,
                "function_call": json.dumps({
                    "name": function_name,
                    "arguments": function_args,
                    "result": function_result
                })
            }

        return {"content": message.content}

    async def _execute_function(
            self,
            function_name: str,
            args: Dict[str, Any],
            user_id: int,
            db: Session
    ) -> Dict[str, Any]:
        """Выполнить функцию AI"""

        if function_name == "get_recent_transactions":
            return await AIFunctions.get_recent_transactions(
                user_id, args.get("limit", 5), db
            )
        elif function_name == "get_budget_status":
            return await AIFunctions.get_budget_status(user_id, db)
        elif function_name == "get_spending_insights":
            return await AIFunctions.get_spending_insights(user_id, db)

        return {"error": f"Unknown function: {function_name}"}

    async def get_suggested_prompts(self, user_id: int, db: Session) -> List[str]:
        """Получить предложенные промпты для пользователя"""
        user_context = await self._get_user_context(user_id, db)

        suggestions = [
            "Show me my recent transactions",
            "How is my budget looking this month?",
            "Give me spending insights",
            "What should I focus on financially?",
            f"I have ${user_context['balance']:,.0f}, what should I do with it?",
            "Help me create a savings plan",
            "Analyze my spending patterns"
        ]

        return suggestions[:4]  # Возвращаем 4 предложения