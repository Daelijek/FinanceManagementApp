# app/models/export.py
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ExportedReport(Base):
    __tablename__ = "exported_reports"

    id = Column(Integer, primary_key=True, index=True)
    export_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Информация об экспорте
    report_type = Column(String, nullable=False)  # weekly_summary, monthly_summary, etc.
    format = Column(String, nullable=False)  # pdf, csv, excel
    status = Column(String, default="processing")  # processing, completed, failed, expired

    # Файл
    file_path = Column(String, nullable=True)
    file_size = Column(String, nullable=True)

    # Ошибка (если есть)
    error_message = Column(Text, nullable=True)

    # Связи
    user = relationship("User", backref="exported_reports")

    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)