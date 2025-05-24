# app/utils/oauth.py
import json
import time
import httpx
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.config import settings
from typing import Optional



class GoogleOAuth:
    @staticmethod
    async def verify_token(token: str) -> dict:
        """Верификация Google ID token"""
        try:
            # Проверка токена через Google API
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            # Проверка аудитории
            if idinfo['aud'] not in [settings.GOOGLE_CLIENT_ID]:
                raise ValueError("Invalid audience")

            # Проверка срока действия
            if idinfo['exp'] < time.time():
                raise ValueError("Token expired")

            return {
                "email": idinfo["email"],
                "name": idinfo.get("name", ""),
                "sub": idinfo["sub"],
                "picture": idinfo.get("picture", None)
            }
        except ValueError as e:
            # Ошибка валидации
            raise ValueError(f"Invalid Google token: {str(e)}")

    @staticmethod
    async def get_token_from_code(code: str, redirect_uri: str) -> dict:
        """Получение токена из кода авторизации"""
        try:
            # Формирование запроса на получение токена
            token_request_data = {
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            }

            # Отправка запроса к Google
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://oauth2.googleapis.com/token',
                    data=token_request_data
                )

                if response.status_code != 200:
                    raise ValueError(f"Failed to get token: {response.text}")

                token_data = response.json()

                # Верификация ID токена
                user_info = await GoogleOAuth.verify_token(token_data['id_token'])

                return {
                    "id_token": token_data['id_token'],
                    "access_token": token_data['access_token'],
                    "user_info": user_info
                }

        except Exception as e:
            raise ValueError(f"Error getting token from code: {str(e)}")


class MicrosoftOAuth:
    @staticmethod
    async def get_token_from_code(code: str, redirect_uri: str) -> dict:
        """Получение токена из кода авторизации Microsoft"""
        try:
            # Формирование запроса на получение токена
            token_request_data = {
                'client_id': settings.MICROSOFT_CLIENT_ID,
                'client_secret': settings.MICROSOFT_CLIENT_SECRET,
                'code': code,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
                'scope': 'openid profile email'
            }

            # Отправка запроса к Microsoft
            async with httpx.AsyncClient() as client:
                token_url = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT}/oauth2/v2.0/token"
                response = await client.post(
                    token_url,
                    data=token_request_data
                )

                if response.status_code != 200:
                    raise ValueError(f"Failed to get token: {response.text}")

                token_data = response.json()

                # Получение информации о пользователе из токена
                user_info = await MicrosoftOAuth.get_user_info(token_data['access_token'])

                return {
                    "id_token": token_data.get('id_token'),
                    "access_token": token_data['access_token'],
                    "user_info": user_info
                }

        except Exception as e:
            raise ValueError(f"Error getting token from code: {str(e)}")

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Получение информации о пользователе Microsoft"""
        try:
            # Запрос информации о пользователе через Microsoft Graph API
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code != 200:
                    raise ValueError(f"Failed to get user info: {response.text}")

                user_data = response.json()

                # Формирование информации о пользователе
                return {
                    "email": user_data.get("mail") or user_data.get("userPrincipalName", ""),
                    "name": user_data.get("displayName", ""),
                    "sub": user_data.get("id"),
                    "picture": None  # Microsoft Graph требует отдельный запрос для фото
                }

        except Exception as e:
            raise ValueError(f"Error getting user info: {str(e)}")

    @staticmethod
    async def get_profile_photo(access_token: str) -> Optional[bytes]:
        """Получение фото профиля пользователя Microsoft"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://graph.microsoft.com/v1.0/me/photo/$value",
                    headers={
                        "Authorization": f"Bearer {access_token}"
                    }
                )

                if response.status_code == 200:
                    return response.content

                return None

        except Exception:
            return None