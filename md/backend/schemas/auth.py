from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

ALLOWED_EMAIL_DOMAIN = "@ghn.vn"
ALLOWED_ROLES = ("admin", "manager", "viewer")


def _check_ghn_domain(email: str) -> str:
    if not email.lower().endswith(ALLOWED_EMAIL_DOMAIN):
        raise ValueError(
            f"Chỉ chấp nhận email công ty Giao Hàng Nhanh (đuôi {ALLOWED_EMAIL_DOMAIN})"
        )
    return email


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("email")
    @classmethod
    def email_must_be_ghn(cls, v: str) -> str:
        return _check_ghn_domain(v)

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Họ tên không được để trống")
        return v.strip()


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Mật khẩu mới phải có ít nhất 8 ký tự")
        return v


class AdminUpdateUserIn(BaseModel):
    """Admin dùng để duyệt/khoá tài khoản hoặc đổi vai trò — mọi field đều optional, chỉ gửi cái cần đổi."""

    status: str | None = None
    role: str | None = None

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: str | None) -> str | None:
        if v is not None and v not in ("pending", "active", "rejected"):
            raise ValueError("status phải là pending | active | rejected")
        return v

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str | None) -> str | None:
        if v is not None and v not in ALLOWED_ROLES:
            raise ValueError(f"role phải thuộc: {', '.join(ALLOWED_ROLES)}")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None
    role: str
    status: str
    is_active: bool
    must_change_password: bool
    created_at: datetime | None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
