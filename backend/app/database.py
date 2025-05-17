# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
import re

# Определяем, какая БД используется
is_sqlite = re.search(r'^sqlite:', settings.DATABASE_URL) is not None

# Создание движка БД с корректными параметрами для каждого типа БД
if is_sqlite:
    # SQLite не поддерживает pool_size и max_overflow
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # Только для SQLite
    )
else:
    # PostgreSQL и другие поддерживают расширенные настройки пула
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )

# Создание сессии
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()


# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()