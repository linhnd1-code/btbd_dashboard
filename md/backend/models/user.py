from datetime import datetime

from core.database import Base
from models.base import SoftDeleteMixin
from sqlalchemy import Boolean, Column, DateTime, Integer, String


# Kế thừa SoftDeleteMixin để sở hữu khả năng Xóa Mềm
class User(Base, SoftDeleteMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)

    role = Column(String, default="viewer")  # "admin" | "manager" | "viewer"
    # Tài khoản tự đăng ký luôn ở trạng thái "pending" tới khi Admin duyệt —
    # KHÔNG dùng is_active cho việc này vì is_active còn ý nghĩa "khoá/mở" tài khoản đang hoạt động.
    status = Column(String, default="pending")  # "pending" | "active" | "rejected"
    is_active = Column(Boolean, default=True)
    # Bắt đổi mật khẩu ở lần đăng nhập đầu tiên — dùng cho tài khoản được Admin cấp sẵn mật khẩu (seed/tạo tay).
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
