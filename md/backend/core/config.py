import os


class Settings:
    PROJECT_NAME: str = "Video Render Core System"
    # Tự động tạo thư mục chứa video
    BASE_DIR: str = os.path.dirname(os.path.dirname(__file__))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    OUTPUT_DIR: str = os.path.join(BASE_DIR, "outputs")


settings = Settings()

# Đảm bảo các thư mục luôn tồn tại khi ứng dụng chạy
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
