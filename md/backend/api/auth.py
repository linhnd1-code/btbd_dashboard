from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    require_roles,
    verify_password,
)
from models.user import User
from schemas.auth import (
    AdminUpdateUserIn,
    ChangePasswordIn,
    LoginIn,
    RegisterIn,
    TokenOut,
    UserOut,
)

router = APIRouter()


def _unique_username_from_email(db: Session, email: str) -> str:
    """Model User vẫn bắt buộc `username` unique/not-null, nhưng luồng đăng ký mới chỉ thu thập
    email + họ tên. Tự sinh username từ phần trước @ để không phải đổi cấu trúc bảng thêm lần nữa,
    thêm số đếm nếu trùng (hiếm khi 2 email khác nhau có cùng phần trước @, nhưng vẫn phải xử lý)."""
    base = email.split("@")[0]
    candidate = base
    counter = 1
    while db.query(User).filter(User.username == candidate).first():
        counter += 1
        candidate = f"{base}{counter}"
    return candidate


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """Tự đăng ký bằng email @ghn.vn — tài khoản tạo ra ở trạng thái "pending",
    phải chờ Admin duyệt (đổi status -> active) mới đăng nhập được."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký")

    user = User(
        username=_unique_username_from_email(db, payload.email),
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role="viewer",
        status="pending",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "status": "success",
        "message": "Đăng ký thành công! Vui lòng chờ Quản trị viên phê duyệt tài khoản trước khi đăng nhập.",
        "data": UserOut.model_validate(user),
    }


@router.post("/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    """Đăng nhập bằng email + password (không dùng username) — trả JWT chứa role để Frontend
    và các API khác (qua `require_roles`) dùng phân quyền."""
    user = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False)).first()

    # Cố ý dùng cùng 1 thông báo lỗi cho "sai email" và "sai mật khẩu" — tránh lộ thông tin
    # email nào đã tồn tại trong hệ thống cho kẻ dò quét (OWASP - User Enumeration).
    wrong_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sai email hoặc mật khẩu!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise wrong_credentials

    if user.status == "pending":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đang chờ Quản trị viên phê duyệt")
    if user.status == "rejected" or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khoá, liên hệ Quản trị viên")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "status": "success",
        "message": "Đăng nhập thành công",
        "data": TokenOut(access_token=access_token, user=UserOut.model_validate(user)),
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"status": "success", "message": "OK", "data": UserOut.model_validate(current_user)}


@router.put("/me/password")
def change_my_password(
    payload: ChangePasswordIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "message": "Đã đổi mật khẩu", "data": UserOut.model_validate(current_user)}


@router.get("/users")
def list_users(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Chỉ Admin xem được toàn bộ danh sách tài khoản (kể cả đang chờ duyệt) để quản lý."""
    users = db.query(User).filter(User.is_deleted.is_(False)).order_by(User.created_at.desc()).all()
    return {"status": "success", "message": "OK", "data": [UserOut.model_validate(u) for u in users]}


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    payload: AdminUpdateUserIn,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Admin duyệt (status=active), từ chối (status=rejected), hoặc đổi vai trò (role) cho 1 tài khoản."""
    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản này")
    if user.id == current_user.id and payload.role and payload.role != "admin":
        # Chặn Admin tự hạ quyền của chính mình — tránh tình huống tự khoá hết quyền truy cập
        # quản lý user của bản thân mà không còn Admin nào khác thao tác lại được.
        raise HTTPException(status_code=400, detail="Không thể tự hạ quyền của chính tài khoản đang đăng nhập")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return {"status": "success", "message": "Đã cập nhật tài khoản", "data": UserOut.model_validate(user)}
