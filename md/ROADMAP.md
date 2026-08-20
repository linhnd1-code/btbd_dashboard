# BẢN ĐỒ PHÁT TRIỂN DỰ ÁN (PROJECT ROADMAP)

Tài liệu này lưu trữ lộ trình phát triển tổng thể của Khung sườn Ứng dụng Nội bộ (Enterprise Internal Framework) từ móng lên đỉnh. 
Bạn có thể đánh dấu tick `[x]` vào các mục đã hoàn thành để theo dõi tiến độ thực tế bất cứ lúc nào.

---

## 🟢 GIAI ĐOẠN 1: TÍNH NĂNG CƠ BẢN (Nền móng sinh tồn)
*Những thành phần cốt lõi để hệ thống bắt đầu chạy được.*

### Backend (Máy chủ)
- [x] **Kiến trúc phân lớp:** Chia rõ Router, Service, Model (Cấu trúc FastAPI).
- [x] **Cơ sở dữ liệu (ORM):** Cài đặt SQLAlchemy + SQLite (Sẵn sàng cho Postgres).
- [ ] **CRUD API:** Các API cơ bản (Tạo, Đọc, Sửa, Xóa dữ liệu).
- [x] **Xác thực (Auth):** Đăng nhập bằng JWT Token và băm mật khẩu Bcrypt.

### Frontend (Giao diện)
- [x] **Định tuyến (Routing):** Phân trang cơ bản bằng React Router.
- [ ] **Bố cục (Layout):** Khung giao diện chuẩn có Header và Sidebar cố định.
- [ ] **Hiển thị dữ liệu:** Các thành phần Bảng (Table) và Form nhập liệu.

---

## 🟡 GIAI ĐOẠN 2: TÍNH NĂNG TIÊU CHUẨN (Mượt mà & An toàn)
*Chuẩn hóa hệ thống đạt mức chuyên nghiệp của doanh nghiệp.*

### Backend (Máy chủ)
- [x] **Phân quyền Cơ bản:** Đã có cột Role trong bảng User.
- [x] **Phân quyền Nâng cao (RBAC):** `core/security.py` (`get_current_user` + `require_roles`) chặn toàn bộ `api/fleet.py` ở cấp router, gắn thêm theo action (VD: `PUT /settings` chỉ Admin, `POST /records` Admin+Quản lý). 3 cấp role: admin/manager/viewer. Đăng nhập/đăng ký chuyển sang dùng email (chỉ nhận đuôi `@ghn.vn`), tự đăng ký ở trạng thái "pending" chờ Admin duyệt qua `PATCH /auth/users/{id}`. Tài khoản Admin gốc: `linhnd1@ghn.vn` (mật khẩu tạm sinh ngẫu nhiên, bắt đổi ở lần đăng nhập đầu — xem `memory.md`).
- [ ] **Bẫy lỗi toàn cục:** Bắt lỗi 500/400 trả về chuẩn JSON đẹp mắt thay vì sập web.
- [ ] **Phân trang & Lọc:** Chặn nghẽn mạng bằng Pagination & Filtering.
- [ ] **Validate Dữ liệu:** Dùng Pydantic kiểm tra tính hợp lệ của input ngay từ vòng ngoài.

### Frontend (Giao diện)
- [x] **Axios Interceptors:** Không dùng axios (dự án hiện dùng `fetch` thuần) — viết tương đương trong `fleet/httpClient.js` (`apiFetch`): tự đính Bearer token vào mọi request, tự phát sự kiện `fleet:session-expired` khi 401 để `AuthContext` đăng xuất.
- [x] **Bảo vệ màn hình:** `fleet/auth/ProtectedRoute.jsx` chặn toàn bộ `/fleet/*` (trừ `/fleet/login`, `/fleet/register`), có hỗ trợ giới hạn theo `roles`.
- [ ] **State Management:** Cài đặt React Query và Zustand để mượt mà, không lag.
- [ ] **Thư viện UI:** Tích hợp TailwindCSS hoặc thư viện UI nhẹ để code nhanh hơn.

---

## 🔴 GIAI ĐOẠN 3: TÍNH NĂNG NÂNG CAO (Hệ thống phức tạp - Dành cho Video)
*Chịu tải cao, tương tác thời gian thực.*

- [ ] **Background Tasks (Cơ bản):** Dùng BackgroundTasks của FastAPI cho tác vụ nặng để không treo máy.
- [ ] **Task Queues (Chuyên nghiệp):** Cài đặt Celery + Redis cho luồng Render Video chuyên biệt.
- [ ] **WebSockets (Realtime):** Bắn thông báo tiến độ Render Video (0% -> 100%) trực tiếp lên giao diện.
- [ ] **Nhật ký Hệ thống:** Cài đặt công cụ `loguru` để ghi toàn bộ lịch sử (Log) ra file text.
- [ ] **Chống Spam (Rate Limiting):** Giới hạn số lần bấm nút gọi API trong 1 phút.
- [ ] **Optimistic UI:** Xử lý Giao diện ảo (Cập nhật thao tác ngay lập tức trên UI trước khi Server báo về).

---

## 🚀 GIAI ĐOẠN 4: VẬN HÀNH & TRIỂN KHAI (DevOps)
*Đưa dự án lên môi trường thực tế.*

- [x] **Docker hóa:** `Dockerfile` build 2 giai đoạn (Node build Frontend tĩnh -> Python phục vụ luôn cả Frontend + API trong 1 image) — xem `render.yaml` để deploy lên Render (Web Service + Postgres free).
- [x] **CI/CD Pipeline:** Tự động kiểm thử code (Code Quality, Security) bằng GitHub Actions.
- [ ] **Tự động Backup:** Viết script tự động nén Database hàng ngày vào lúc nửa đêm.
