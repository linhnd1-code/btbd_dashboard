# BACKEND

Thư mục này chứa toàn bộ mã nguồn xử lý logic máy chủ, API và tương tác cơ sở dữ liệu.

## Cấu trúc đề xuất (Mô hình MVC hoặc 3-Layer Architecture):
- `src/routes/`: Định nghĩa các API endpoint (VD: `GET /users`, `POST /login`).
- `src/controllers/`: Tiếp nhận Request từ routes, kiểm tra input và gọi xuống Services.
- `src/services/`: Chứa toàn bộ Business Logic (logic nghiệp vụ lõi).
- `src/models/` (hoặc `entities/`): Khai báo cấu trúc bảng trong Database (Schema) thông qua ORM (Prisma, Mongoose, TypeORM...).
- `src/middlewares/`: Cầu nối kiểm tra trước khi vào controller (Check token, phân quyền, validate data).
- `src/config/`: Cấu hình kết nối Database, Redis, biến môi trường.
- `src/utils/`: Các hàm mã hóa password, tạo JWT token...
