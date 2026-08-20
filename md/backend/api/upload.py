import os

import aiofiles
from core.config import settings
from fastapi import APIRouter, File, Form, UploadFile

router = APIRouter()


@router.post("/chunk")
async def upload_video_chunk(
    file: UploadFile = File(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    filename: str = Form(...),
):
    """
    API nhận video băm nhỏ (Chunked Upload). Tránh sập RAM máy chủ.
    Ví dụ: Frontend có file Video 1GB, sẽ cắt ra làm 100 mảnh (10MB/mảnh) rồi gửi gọi API này 100 lần.
    """
    # Tạo thư mục chứa file tạm
    temp_dir = os.path.join(settings.UPLOAD_DIR, "temp_chunks", filename)
    os.makedirs(temp_dir, exist_ok=True)

    chunk_path = os.path.join(temp_dir, f"chunk_{chunk_index}")

    # Ghi đè mảnh video (Chunk) vào thư mục tạm bằng I/O bất đồng bộ (aiofiles)
    async with aiofiles.open(chunk_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Kiểm tra xem đã nhận đủ 100% các mảnh chưa
    uploaded_chunks = len(os.listdir(temp_dir))
    if uploaded_chunks == total_chunks:
        # Bước Gom mảnh (Merge): Ráp tất cả các mảnh lại thành 1 file hoàn chỉnh
        final_path = os.path.join(settings.UPLOAD_DIR, filename)
        with open(final_path, "wb") as final_file:
            for i in range(total_chunks):
                chunk_file = os.path.join(temp_dir, f"chunk_{i}")
                with open(chunk_file, "rb") as c:
                    final_file.write(c.read())
                os.remove(chunk_file)  # Dọn rác
        os.rmdir(temp_dir)
        return {
            "status": "success",
            "message": "Đã ghép nối và tải video thành công!",
            "path": final_path,
        }

    return {
        "status": "processing",
        "message": f"Đã nhận mảnh {chunk_index + 1}/{total_chunks}",
    }
