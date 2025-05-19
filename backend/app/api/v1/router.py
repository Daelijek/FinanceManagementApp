# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import auth, users, profile, settings, categories, transactions

api_router = APIRouter()

# Подключаем роутеры
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(settings.router)
api_router.include_router(categories.router)
api_router.include_router(transactions.router)