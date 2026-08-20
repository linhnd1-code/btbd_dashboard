import asyncio
import secrets
from pathlib import Path

from dotenv import load_dotenv

# PHẢI load .env TRƯỚC MỌI import khác trong module này — core/security.py đọc SECRET_KEY bằng
# os.getenv() ngay ở cấp module (chạy 1 lần lúc import), nên nếu load_dotenv() chạy sau dòng
# `from api.auth import ...` (import này kéo theo core/security.py) thì đã quá muộn, biến môi
# trường chưa kịp có sẵn. File .env nằm ở gốc dự án (`dashboard/md/.env`, cùng cấp .env.example),
# không phải trong thư mục backend/ — nên phải chỉ rõ đường dẫn, không dùng load_dotenv() mặc định
# (mặc định chỉ tìm .env ở working directory hiện tại, tức backend/, không có file ở đó).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from api.routes import router as api_router  # noqa: E402
from api.auth import router as auth_router  # noqa: E402
from api.upload import router as upload_router  # noqa: E402
from api.fleet import router as fleet_router  # noqa: E402
from core.config import settings  # noqa: E402
from core.database import engine, SessionLocal  # noqa: E402
from core.migrate import run_startup_migrations  # noqa: E402
from core.security import get_password_hash  # noqa: E402
from models.user import Base as UserBase, User  # noqa: E402
from models.audit import Base as AuditBase  # noqa: E402
from models.vehicle import Vehicle  # noqa: F401,E402
from models.maintenance_record import MaintenanceRecord  # noqa: F401,E402
from models.vehicle_maintenance_status import VehicleMaintenanceStatus  # noqa: F401,E402
from models.app_settings import AppSettings  # noqa: F401,E402
from services import sheet_sync  # noqa: E402

SHEET_SYNC_INTERVAL_SECONDS = 60
ADMIN_SEED_EMAIL = "linhnd1@ghn.vn"

# Khởi tạo các bảng Database (Users, Audit_Logs, và dữ liệu đội xe)
UserBase.metadata.create_all(bind=engine)
AuditBase.metadata.create_all(bind=engine)
# create_all() ở trên chỉ tạo bảng MỚI — bảng "users" tạo từ trước khi thêm 3 cột
# (full_name/status/must_change_password) cần ALTER TABLE riêng, xem core/migrate.py.
run_startup_migrations(engine)


def _seed_admin_account() -> None:
    """Tạo sẵn 1 tài khoản Admin duy nhất cho `ADMIN_SEED_EMAIL` nếu chưa tồn tại.

    Chạy an toàn qua nhiều lần khởi động (idempotent) — chỉ tạo đúng 1 lần, các lần sau thấy
    email đã có thì bỏ qua. Mật khẩu sinh ngẫu nhiên và CHỈ in ra console đúng 1 lần lúc tạo —
    không lưu plaintext ở đâu khác (đúng nguyên tắc Security First: không hardcode secret).
    """
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_SEED_EMAIL).first()
        if existing:
            return
        generated_password = secrets.token_urlsafe(9)  # ~12 ký tự, đủ mạnh cho mật khẩu tạm
        admin = User(
            username="linhnd1",
            email=ADMIN_SEED_EMAIL,
            full_name="Quản trị viên hệ thống",
            hashed_password=get_password_hash(generated_password),
            role="admin",
            status="active",
            is_active=True,
            must_change_password=True,
        )
        db.add(admin)
        db.commit()
        print("=" * 72)
        print(f"[seed_admin] Đã tạo tài khoản Admin: {ADMIN_SEED_EMAIL}")
        print(f"[seed_admin] Mật khẩu tạm (chỉ hiện 1 lần này): {generated_password}")
        print("[seed_admin] Hãy đăng nhập và đổi mật khẩu ngay — hệ thống sẽ tự bắt đổi ở lần đăng nhập đầu.")
        print("=" * 72)
    finally:
        db.close()


_seed_admin_account()

app = FastAPI(title=settings.PROJECT_NAME, description="Enterprise Framework API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nhúng các API vào hệ thống
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(upload_router, prefix="/api/v1/upload", tags=["File Upload"])
app.include_router(fleet_router, prefix="/api/v1/fleet", tags=["Fleet"])
app.include_router(api_router, prefix="/api/v1", tags=["General"])

def _sync_from_sheet_blocking() -> None:
    db = SessionLocal()
    try:
        sheet_sync.sync_from_sheet(db)
        print(f"[sheet_sync] Đồng bộ thành công: {sheet_sync.LAST_SYNC_STATUS}")
    except Exception as exc:
        sheet_sync.record_sync_error(str(exc))
        print(f"[sheet_sync] Lỗi đồng bộ tự động: {exc}")
    finally:
        db.close()


async def _periodic_sheet_sync() -> None:
    loop = asyncio.get_event_loop()
    while True:
        await loop.run_in_executor(None, _sync_from_sheet_blocking)
        await asyncio.sleep(SHEET_SYNC_INTERVAL_SECONDS)


@app.on_event("startup")
async def start_periodic_sheet_sync() -> None:
    asyncio.create_task(_periodic_sheet_sync())


@app.get("/")
def read_root():
    return {"message": "Welcome to Internal App Framework. Go to /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
