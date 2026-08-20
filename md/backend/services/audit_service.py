from sqlalchemy.orm import Session
from models.audit import AuditLog

def log_audit_action(db: Session, user_id: int, action: str, table_name: str, record_id: str, old_data: dict = None, new_data: dict = None):
    """
    Hàm gọi nhanh để lưu nhật ký.
    Sử dụng hàm này ngay trước khi db.commit() ở các tính năng Sửa/Xóa.
    """
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        table_name=table_name,
        record_id=str(record_id),
        old_data=old_data,
        new_data=new_data
    )
    db.add(audit_entry)
    db.commit()
