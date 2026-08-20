from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    message: str


@router.get("/health", response_model=HealthResponse)
async def check_health():
    """
    API dùng để kiểm tra trạng thái hoạt động của hệ thống (Khung sườn)
    """
    return {
        "status": "success",
        "message": "Hệ thống tổng quan đang hoạt động tốt! Kết nối Backend - Frontend thành công.",
    }
