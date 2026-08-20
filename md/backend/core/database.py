import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Mặc định dùng SQLite để dev cho nhanh — khi deploy Production (Render...), biến môi trường
# DATABASE_URL được nền tảng tự cấp (Postgres) sẽ override giá trị này. Ổ đĩa container trên các
# PaaS free tier là ephemeral (mất hết khi container restart) — Postgres managed riêng biệt mới
# giữ được dữ liệu (tài khoản, phiếu bảo dưỡng tự tạo...) qua các lần restart/deploy.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./internal_app.db")

# `check_same_thread` chỉ tồn tại/cần thiết cho SQLite — Postgres không có khái niệm này và sẽ
# báo lỗi nếu truyền vào, nên chỉ thêm connect_args khi thực sự đang dùng SQLite.
connect_args = (
    {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
)
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency để tự động lấy kết nối DB cho mỗi API và tự động đóng khi xong
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
