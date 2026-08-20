# INFRASTRUCTURE & DEVOPS

Thư mục này chứa các file cấu hình liên quan đến triển khai (Deployment) và Môi trường.

## Các thành phần cần có:
- `docker/`: Chứa `Dockerfile` và `docker-compose.yml` để chạy dự án bằng container, giúp đồng nhất môi trường cho tất cả mọi người.
- `ci-cd/` (hoặc `.github/workflows/`): Chứa các file cấu hình tự động test và deploy (GitHub Actions, GitLab CI).
- `terraform/`: (Tùy chọn) Nếu dự án lớn dùng AWS/GCP.
