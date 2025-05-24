# app/utils/mailer.py

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from app.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME   = settings.SMTP_USER,
    MAIL_PASSWORD   = settings.SMTP_PASSWORD,
    MAIL_FROM       = settings.EMAILS_FROM_EMAIL,
    MAIL_PORT       = settings.SMTP_PORT,
    MAIL_SERVER     = settings.SMTP_HOST,
    MAIL_STARTTLS   = settings.SMTP_TLS,
    MAIL_SSL_TLS    = settings.SMTP_SSL,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS  = True,
)

async def send_reset_email(recipient: str, token: str) -> None:
    """
    Отправляет письмо с кодом сброса пароля.
    """
    body = (
        f"Здравствуйте!\n\n"
        f"Вы запросили сброс пароля. Ваш код для подтверждения:\n\n"
        f"    {token}\n\n"
        f"Он действителен в течение "
        f"{settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} час(ов).\n\n"
        f"Если вы не запрашивали сброс, просто проигнорируйте это письмо."
    )
    message = MessageSchema(
        subject="Сброс пароля на Financial App Backend",
        recipients=[recipient],
        body=body,
        subtype="plain",
    )
    fm = FastMail(conf)
    await fm.send_message(message)