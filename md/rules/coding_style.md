# QUY CHUẨN VIẾT CODE (CODING STYLE)

Tài liệu này quy định cách thức viết code đồng nhất cho mọi thành viên dự án, giúp source code luôn sạch sẽ, dễ đọc như thể do 1 người viết ra.

## 1. Naming Conventions (Quy tắc đặt tên)
- **Biến và Hàm (Variables, Functions, Methods):** 
  - **Frontend (JS/TS):** Sử dụng `camelCase` (Ví dụ: `userInfo`, `calculateTotalPrice()`).
  - **Backend (Python):** Sử dụng `snake_case` (Ví dụ: `user_info`, `calculate_total_price()`).
  - *Lưu ý:* Tên hàm nên bắt đầu bằng một động từ (`get`, `set`, `fetch`, `is`, `has`...).
- **Classes, Interfaces, Components:** Sử dụng `PascalCase`. 
  - *Ví dụ:* `UserProfile`, `AuthenticationService`, `ButtonComponent`.
- **Hằng số (Constants):** Sử dụng `UPPER_SNAKE_CASE`. 
  - *Ví dụ:* `MAX_RETRY_COUNT`, `API_BASE_URL`.
- **Thư mục và Tệp tin (Files & Directories):** Ưu tiên sử dụng `kebab-case` (dấu gạch ngang). 
  - *Ví dụ:* `user-profile.tsx`, `auth-service.ts`.

## 2. Formatting (Định dạng)
- **Frontend:** Sử dụng **Prettier** và **ESLint**.
- **Backend:** Sử dụng **Black**, **Isort** và **Flake8**.
- (Tất cả công cụ này đã được ép tự động qua `.pre-commit-config.yaml`).
- Tab / Thụt lề: 2 spaces hoặc 4 spaces (phải cấu hình đồng nhất toàn dự án).
- Bật tính năng xóa khoảng trắng thừa ở cuối dòng.
- Thêm dấu phẩy cuối (Trailing comma) cho Array/Object nếu làm việc với JS/TS để dễ đọc diff khi review Git.

## 3. Cấu trúc một File Code chuẩn
Nên sắp xếp các dòng code trong file theo thứ tự:
1. `import` thư viện bên ngoài (external: React, lodash...).
2. `import` module bên trong dự án (internal: utils, components...).
3. Khai báo Interfaces / Types.
4. Khai báo Hằng số (Constants).
5. Code logic chính (Class / Function / Component).
6. Khai báo helper functions nhỏ.
7. `export` module.

## 4. Comment và Tài liệu
- **Không comment những thứ hiển nhiên:** Đừng viết `// tăng x lên 1` cho dòng code `x++`.
- **Comment TẠI SAO (Why), không phải LÀM GÌ (What):** Comment lý do bạn phải dùng một thủ thuật đặc biệt hoặc một thuật toán phức tạp để người sau hiểu được ngữ cảnh.
- Cố gắng viết code tự giải thích (Self-documenting code) thông qua cách đặt tên biến rõ ràng, hạn chế việc phải phụ thuộc vào comment.
