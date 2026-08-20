from sqlalchemy import Column, Boolean, DateTime
from datetime import datetime

class SoftDeleteMixin:
    """
    Mixin này dùng để tái sử dụng cho mọi bảng trong Database.
    Thay vì xóa thật, hệ thống chỉ đổi trạng thái is_deleted = True.
    """
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
