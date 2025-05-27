# app/utils/logging_config.py
import logging
import logging.config
import os
from pathlib import Path

def setup_logging():
    """Настройка системы логгирования"""
    
    # Создаем директорию для логов
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Конфигурация логгирования
    LOGGING_CONFIG = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'detailed': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S',
            },
            'simple': {
                'format': '%(levelname)s - %(message)s',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'INFO',
                'formatter': 'simple',
                'stream': 'ext://sys.stdout',
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'DEBUG',
                'formatter': 'detailed',
                'filename': 'logs/app.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'encoding': 'utf8',
            },
            'export_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'DEBUG',
                'formatter': 'detailed',
                'filename': 'logs/exports.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 3,
                'encoding': 'utf8',
            },
        },
        'loggers': {
            'app.services.report': {
                'level': 'DEBUG',
                'handlers': ['console', 'export_file'],
                'propagate': False,
            },
            'app.services.export_generator': {
                'level': 'DEBUG',
                'handlers': ['console', 'export_file'],
                'propagate': False,
            },
            'app.api.v1.reports': {
                'level': 'DEBUG',
                'handlers': ['console', 'file'],
                'propagate': False,
            },
        },
        'root': {
            'level': 'INFO',
            'handlers': ['console', 'file'],
        },
    }
    
    logging.config.dictConfig(LOGGING_CONFIG)
    
    # Создаем логгер для приложения
    logger = logging.getLogger(__name__)
    logger.info("Logging system initialized")
    
    return logger