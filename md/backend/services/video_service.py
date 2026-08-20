import time

from core.config import settings


def render_video_task(title: str, duration: int):
    """
    Hàm này xử lý logic render video (Tốn nhiều thời gian).
    Thực tế bạn sẽ tích hợp FFmpeg hoặc MoviePy tại đây.
    """
    print(f"\n[VIDEO_SERVICE] 🟢 Bắt đầu render video: {title}")

    # Mô phỏng quá trình xử lý chậm
    for i in range(1, 6):
        time.sleep(1)
        print(f"[VIDEO_SERVICE] ⏳ Tiến độ: {i * 20}%...")

    print(f"[VIDEO_SERVICE] ✅ Hoàn thành! Video được lưu tại {settings.OUTPUT_DIR}\n")
