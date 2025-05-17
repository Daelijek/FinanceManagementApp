# app/main.py (исправленная версия для on_event)
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_router


# Лайфспан событие (замена для on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Действия при запуске
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")

    # Здесь можно добавить:
    # - Создание таблиц БД
    # - Инициализация кеша
    # - Подключение к внешним сервисам

    yield  # Здесь приложение работает

    # Действия при остановке
    print("Shutting down...")

    # Здесь можно добавить:
    # - Закрытие соединений
    # - Сохранение состояния
    # - Очистка ресурсов


# Создание приложения
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan  # Используем новый механизм лайфспан
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(api_router, prefix=settings.API_V1_STR)


# Корневой эндпоинт
@app.get("/")
async def root():
    return {
        "message": "Welcome to Financial App API",
        "documentation": "/docs",
        "version": settings.VERSION
    }


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}