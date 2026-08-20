from core.database import Base
from sqlalchemy import Column, Integer


class AppSettings(Base):
    """Cấu hình ngưỡng cảnh báo của module Fleet. Luôn chỉ có 1 dòng (id=1)."""

    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    expiry_alert_window_days = Column(Integer, default=30, nullable=False)
    due_threshold_km = Column(Integer, default=1000, nullable=False)
    upcoming_threshold_km = Column(Integer, default=5000, nullable=False)
