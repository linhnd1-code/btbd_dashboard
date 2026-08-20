# FRONTEND

Thư mục này chứa toàn bộ mã nguồn của giao diện người dùng (Client-side).

## Cấu trúc đề xuất (áp dụng cho React/Next.js/Vue):
- `src/components/`: Chứa các UI Component dùng chung (Button, Input, Modal...).
- `src/pages/` (hoặc `app/`): Chứa các trang giao diện theo Routing (Home, Login, Dashboard...).
- `src/hooks/`: Các custom hook xử lý logic (nếu dùng React).
- `src/services/` (hoặc `api/`): Các hàm gọi API tương tác với Backend.
- `src/utils/`: Các hàm tiện ích (format ngày tháng, tiền tệ...).
- `src/styles/`: CSS, SCSS, hoặc cấu hình Tailwind.
- `src/store/`: Quản lý state toàn cục (Redux, Zustand, Vuex...).
- `public/`: Chứa ảnh, icon, font chữ tĩnh.
