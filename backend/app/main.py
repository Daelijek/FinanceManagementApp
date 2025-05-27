# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_router
from app.utils.scheduler import setup_scheduler
from app.utils.logging_config import setup_logging
import logging

# Глобальная переменная для планировщика
scheduler = None


# Лайфспан событие
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Действия при запуске
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")

    # Настраиваем логгирование
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")

    # Запускаем планировщик задач
    global scheduler
    scheduler = setup_scheduler()
    scheduler.start()
    logger.info("Background task scheduler started")

    yield  # Здесь приложение работает

    # Действия при остановке
    logger.info("Shutting down...")

    # Останавливаем планировщик задач
    if scheduler:
        scheduler.shutdown()
        logger.info("Background task scheduler stopped")


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