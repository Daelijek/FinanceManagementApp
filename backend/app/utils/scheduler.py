# app/utils/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.triggers.cron import CronTrigger
from app.config import settings
from app.database import SessionLocal
from app.services.notification import NotificationService
import logging
from contextlib import contextmanager

# Настройка логгера
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Создаем контекстный менеджер для сессии БД
@contextmanager
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Задача: генерация еженедельного отчета по пятницам в 18:00
async def generate_weekly_reports():
    logger.info("Generating weekly reports for all users...")
    with get_db_session() as db:
        # Получаем всех активных пользователей
        from app.models.user import User
        from app.models.financial import UserProfile

        # Получаем пользователей с включенными email уведомлениями
        users = db.query(User).join(
            UserProfile, User.id == UserProfile.user_id
        ).filter(
            User.is_active == True,
            UserProfile.email_notifications == True
        ).all()

        count = 0
        for user in users:
            try:
                notification = await NotificationService.generate_weekly_summary(user.id, db)
                if notification:
                    count += 1
            except Exception as e:
                logger.error(f"Error generating weekly report for user {user.id}: {e}")

        logger.info(f"Successfully generated {count} weekly reports")


# Задача: проверка предстоящих платежей
async def check_upcoming_bills():
    logger.info("Checking upcoming bills for all users...")
    with get_db_session() as db:
        # Здесь будет логика проверки предстоящих платежей
        # и создания соответствующих уведомлений
        # ...
        pass


# Создаем и настраиваем планировщик задач
def setup_scheduler():
    jobstores = {
        'default': SQLAlchemyJobStore(url=settings.DATABASE_URL)
    }

    scheduler = BackgroundScheduler(jobstores=jobstores)

    # Добавляем задачи в планировщик

    # Еженедельный отчет по пятницам в 18:00
    scheduler.add_job(
        generate_weekly_reports,
        trigger=CronTrigger(day_of_week='fri', hour=18, minute=0),
        id='weekly_reports',
        replace_existing=True
    )

    # Проверка предстоящих платежей ежедневно в 9:00
    scheduler.add_job(
        check_upcoming_bills,
        trigger=CronTrigger(hour=9, minute=0),
        id='check_upcoming_bills',
        replace_existing=True
    )

    return scheduler