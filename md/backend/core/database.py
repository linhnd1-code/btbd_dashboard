from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Sử dụng SQLite mặc định để dễ phát triển ban đầu.
# Lên Production, đổi URL thành "postgresql://user:password@localhost/dbname"
SQLALCHEMY_DATABASE_URL = "sqlite:///./internal_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency để tự động lấy kết nối DB cho mỗi API và tự động đóng khi xong
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
