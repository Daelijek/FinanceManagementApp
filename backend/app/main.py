# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_router

# Создание приложения
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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


# Обработчик событий при запуске
@app.on_event("startup")
async def startup_event():
    """Действия при запуске приложения"""
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")

    # Здесь можно добавить:
    # - Создание таблиц БД
    # - Инициализация кеша
    # - Подключение к внешним сервисам


# Обработчик событий при остановке
@app.on_event("shutdown")
async def shutdown_event():
    """Действия при остановке приложения"""
    print("Shutting down...")

    # Здесь можно добавить:
    # - Закрытие соединений
    # - Сохранение состояния
    # - Очистка ресурсов