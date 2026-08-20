"""
Migration nhẹ cho SQLite — dự án chưa dùng Alembic, mà `Base.metadata.create_all()`
CHỈ tạo bảng mới, KHÔNG tự thêm cột mới vào bảng đã tồn tại. Module này bù lại phần đó
bằng cách tự kiểm tra + ALTER TABLE ADD COLUMN cho các cột được thêm sau khi bảng đã chạy
thực tế (an toàn để gọi lại nhiều lần — bỏ qua cột đã có).
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_columns(engine: Engine, table_name: str, columns: dict) -> None:
    """Thêm các cột còn thiếu vào `table_name`.

    `columns` là map {tên_cột: định nghĩa_SQL_ALTER}, ví dụ {"status": "VARCHAR DEFAULT 'pending'"}.
    """
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return  # Bảng chưa tồn tại — create_all() ở main.py sẽ tạo đủ cột ngay từ đầu.

    existing = {col["name"] for col in inspector.get_columns(table_name)}
    missing = {name: ddl for name, ddl in columns.items() if name not in existing}
    if not missing:
        return

    with engine.begin() as conn:
        for name, ddl in missing.items():
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {ddl}"))
            print(f"[migrate] Đã thêm cột thiếu: {table_name}.{name}")


def run_startup_migrations(engine: Engine) -> None:
    """Gọi 1 lần khi khởi động app, trước khi seed dữ liệu."""
    ensure_columns(
        engine,
        "users",
        {
            "full_name": "VARCHAR",
            "status": "VARCHAR DEFAULT 'pending'",
            "must_change_password": "BOOLEAN DEFAULT 0",
        },
    )
