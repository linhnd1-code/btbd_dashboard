from datetime import datetime

from core.database import Base
from sqlalchemy import JSON, Column, DateTime, Integer, String


class AuditLog(Base):
    """Bảng lưu vết mọi thao tác của người dùng trên hệ thống"""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)  # ID nhân viên thao tác
    action = Column(String, index=True, nullable=False)  # Lệnh: CREATE, UPDATE, DELETE
    table_name = Column(
        String, index=True, nullable=False
    )  # Bảng bị tác động (vd: 'users', 'videos')
    record_id = Column(String, index=True, nullable=False)  # Mã dòng bị sửa
    old_data = Column(JSON, nullable=True)  # Nội dung trước khi sửa
    new_data = Column(JSON, nullable=True)  # Nội dung sau khi sửa
    created_at = Column(DateTime, default=datetime.utcnow)
