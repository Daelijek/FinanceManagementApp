from openai import AsyncOpenAI
from typing import List, Dict, Any, Optional
from app.config import settings


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def get_completion(
            self,
            messages: List[Dict[str, str]],
            tools: Optional[List[Dict]] = None,
            model: str = "gpt-3.5-turbo"
    ) -> Any:
        """Получить ответ от ChatGPT"""
        try:
            params = {
                "model": model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }

            if tools:
                params["tools"] = tools
                params["tool_choice"] = "auto"

            response = await self.client.chat.completions.create(**params)
            return response

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    def create_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Создать системный промпт с контекстом пользователя"""
        return f"""
        You are a helpful financial assistant for a personal finance app. 

        User's financial context:
        - Current balance: ${user_context.get('balance', 0):,.2f}
        - Monthly budget usage: {user_context.get('budget_percentage', 0):.1f}%
        - Top spending category: {user_context.get('top_category', 'Unknown')}

        Available tools:
        - get_transactions: View recent transactions
        - get_budget_status: Check budget information
        - get_spending_insights: Analyze spending patterns

        Guidelines:
        - Be helpful and friendly
        - Provide actionable financial advice
        - Use data from user's account when relevant
        - Suggest specific actions when appropriate
        - Keep responses concise but informative
        """