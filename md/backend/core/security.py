import os
from datetime import datetime, timedelta

from core.database import get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from models.user import User
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Cấu hình băm mật khẩu chuẩn Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Lấy từ biến môi trường (Lý tưởng), tạm thời hardcode để chạy thử
SECRET_KEY = os.getenv("SECRET_KEY", "khoa-bao-mat-cuc-ky-bi-mat-cua-cong-ty")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # Token sống 8 tiếng (1 ngày làm việc)

if SECRET_KEY == "khoa-bao-mat-cuc-ky-bi-mat-cua-cong-ty":
    # Cảnh báo rõ thay vì im lặng dùng khóa mặc định — tránh quên đặt SECRET_KEY thật khi lên Production
    # (core_principles.md: "Security First" — không hardcode secret dùng thật).
    print(
        "[security] CẢNH BÁO: đang dùng SECRET_KEY mặc định (dev only). "
        "Hãy đặt biến môi trường SECRET_KEY thật trước khi triển khai Production."
    )

# tokenUrl chỉ phục vụ hiển thị nút "Authorize" trên Swagger /docs — luồng đăng nhập thật của
# Frontend dùng JSON body (email/password) ở api/auth.py, không dùng OAuth2PasswordRequestForm.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Giải mã Bearer Token, trả về User thật đang đăng nhập.

    Dùng làm Depends() ở mọi API cần bắt buộc đăng nhập.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Chưa đăng nhập hoặc token không hợp lệ",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise unauthorized
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise unauthorized
    except JWTError:
        raise unauthorized

    user = (
        db.query(User).filter(User.email == email, User.is_deleted.is_(False)).first()
    )
    if not user:
        raise unauthorized
    if not user.is_active or user.status != "active":
        # Phân biệt rõ 403 (biết danh tính nhưng bị chặn) với 401 (không biết là ai) để Frontend
        # hiển thị đúng thông báo "tài khoản bị khoá/chờ duyệt" thay vì bắt đăng nhập lại vô nghĩa.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản chưa được kích hoạt hoặc đã bị khoá",
        )
    return user


def require_roles(*allowed_roles: str):
    """Factory tạo Depends() chặn API nếu role của user hiện tại không nằm trong danh sách cho phép.

    Ví dụ: `Depends(require_roles("admin", "manager"))`.
    """

    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Chức năng này yêu cầu quyền: {', '.join(allowed_roles)}",
            )
        return current_user

    return _check
