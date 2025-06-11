# app/utils/mailer.py
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.config import settings
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# Глобальная переменная для кеширования конфигурации
_mail_config: Optional[ConnectionConfig] = None
_config_checked = False

def get_mail_config() -> Optional[ConnectionConfig]:
    """Получить конфигурацию почты"""
    global _mail_config, _config_checked
    
    if _config_checked and _mail_config is None:
        return None
    
    if _mail_config is not None:
        return _mail_config
    
    _config_checked = True
    
    # Проверяем обязательные настройки
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST not configured. Email sending will be disabled.")
        return None
        
    if not settings.SMTP_USER:
        logger.warning("SMTP_USER not configured. Email sending will be disabled.")
        return None
        
    if not settings.SMTP_PASSWORD:
        logger.warning("SMTP_PASSWORD not configured. Email sending will be disabled.")
        return None
    
    try:
        _mail_config = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.EMAILS_FROM_EMAIL or settings.SMTP_USER,
            MAIL_PORT=settings.SMTP_PORT or 587,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_STARTTLS=settings.SMTP_TLS,
            MAIL_SSL_TLS=settings.SMTP_SSL,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
        )
        logger.info("SMTP configuration loaded successfully")
        return _mail_config
    except Exception as e:
        logger.error(f"Failed to create mail configuration: {str(e)}")
        return None


async def send_reset_email(recipient: str, token: str, user_name: str = None) -> bool:
    """
    Отправляет письмо с кодом сброса пароля.
    
    Args:
        recipient: Email получателя
        token: Токен для сброса пароля
        user_name: Имя пользователя (опционально)
    
    Returns:
        bool: True если письмо отправлено успешно, False если ошибка
    """
    try:
        conf = get_mail_config()
        if not conf:
            logger.error("Email configuration not available. Cannot send reset email.")
            return False
        
        # Создаем ссылку для сброса пароля
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        # Формируем тело письма
        greeting = f"Здравствуйте{', ' + user_name if user_name else ''}!"
        
        body = f"""
{greeting}

Вы запросили сброс пароля для вашего аккаунта в {settings.PROJECT_NAME}.

Чтобы сбросить пароль, перейдите по следующей ссылке:
{reset_link}

Или используйте этот код для подтверждения: {token}

Ссылка действительна в течение {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} час(ов).

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.

--
С уважением,
Команда {settings.PROJECT_NAME}
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Сброс пароля</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .button {{ 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
        }}
        .code {{ 
            background: #f8f9fa; 
            padding: 15px; 
            border-left: 4px solid #007bff; 
            margin: 15px 0;
            font-family: monospace;
            font-size: 16px;
        }}
        .footer {{ 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #666; 
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Сброс пароля - {settings.PROJECT_NAME}</h2>
        </div>
        
        <p>{greeting}</p>
        
        <p>Вы запросили сброс пароля для вашего аккаунта в <strong>{settings.PROJECT_NAME}</strong>.</p>
        
        <p>Чтобы сбросить пароль, нажмите на кнопку ниже:</p>
        
        <a href="{reset_link}" class="button">Сбросить пароль</a>
        
        <p>Или используйте этот код для подтверждения:</p>
        <div class="code">{token}</div>
        
        <p><strong>Важно:</strong> Ссылка действительна в течение {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} час(ов).</p>
        
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        
        <div class="footer">
            <p>С уважением,<br>
            Команда {settings.PROJECT_NAME}</p>
        </div>
    </div>
</body>
</html>
"""

        message = MessageSchema(
            subject=f"Сброс пароля - {settings.PROJECT_NAME}",
            recipients=[recipient],
            body=html_body,
            html=html_body,
            subtype=MessageType.html,
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"Password reset email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {recipient}: {str(e)}")
        return False


async def send_verification_email(recipient: str, verification_code: str, user_name: str = None) -> bool:
    """
    Отправляет письмо с кодом подтверждения email адреса.
    
    Args:
        recipient: Email получателя
        verification_code: Код подтверждения
        user_name: Имя пользователя (опционально)
    
    Returns:
        bool: True если письмо отправлено успешно, False если ошибка
    """
    try:
        conf = get_mail_config()
        if not conf:
            logger.error("Email configuration not available. Cannot send verification email.")
            return False
        
        # Создаем ссылку для подтверждения
        verification_link = f"{settings.FRONTEND_URL}/verify-email?code={verification_code}"
        
        greeting = f"Добро пожаловать{', ' + user_name if user_name else ''}!"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Подтверждение email</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .button {{ 
            display: inline-block; 
            padding: 12px 24px; 
            background: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
        }}
        .code {{ 
            background: #f8f9fa; 
            padding: 15px; 
            border-left: 4px solid #28a745; 
            margin: 15px 0;
            font-family: monospace;
            font-size: 16px;
        }}
        .footer {{ 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #666; 
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Подтверждение email - {settings.PROJECT_NAME}</h2>
        </div>
        
        <p>{greeting}</p>
        
        <p>Спасибо за регистрацию в <strong>{settings.PROJECT_NAME}</strong>!</p>
        
        <p>Чтобы завершить регистрацию, пожалуйста, подтвердите ваш email адрес:</p>
        
        <a href="{verification_link}" class="button">Подтвердить Email</a>
        
        <p>Или используйте этот код для подтверждения:</p>
        <div class="code">{verification_code}</div>
        
        <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
        
        <div class="footer">
            <p>С уважением,<br>
            Команда {settings.PROJECT_NAME}</p>
        </div>
    </div>
</body>
</html>
"""

        message = MessageSchema(
            subject=f"Подтвердите ваш email - {settings.PROJECT_NAME}",
            recipients=[recipient],
            body=html_body,
            html=html_body,
            subtype=MessageType.html,
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"Verification email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {recipient}: {str(e)}")
        return False


async def send_notification_email(recipient: str, subject: str, content: str, user_name: str = None) -> bool:
    """
    Отправляет уведомительное письмо.
    
    Args:
        recipient: Email получателя
        subject: Тема письма
        content: Содержимое письма
        user_name: Имя пользователя (опционально)
    
    Returns:
        bool: True если письмо отправлено успешно, False если ошибка
    """
    try:
        conf = get_mail_config()
        if not conf:
            logger.error("Email configuration not available. Cannot send notification email.")
            return False
        
        greeting = f"Здравствуйте{', ' + user_name if user_name else ''}!"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{subject}</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .content {{ margin: 20px 0; }}
        .footer {{ 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #666; 
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>{subject}</h2>
        </div>
        
        <p>{greeting}</p>
        
        <div class="content">
            {content}
        </div>
        
        <div class="footer">
            <p>С уважением,<br>
            Команда {settings.PROJECT_NAME}</p>
        </div>
    </div>
</body>
</html>
"""

        message = MessageSchema(
            subject=subject,
            recipients=[recipient],
            body=html_body,
            html=html_body,
            subtype=MessageType.html,
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"Notification email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send notification email to {recipient}: {str(e)}")
        return False