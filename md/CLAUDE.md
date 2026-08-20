# BỘ NÃO DỰ ÁN (PROJECT BRAIN)

Đây là tệp cấu hình cốt lõi cho dự án, đóng vai trò điều hướng toàn bộ hành vi, ngữ cảnh và quy chuẩn của các thành viên (kể cả trợ lý AI) tham gia dự án.

## 1. Tổng quan dự án (Project Overview)
- **Loại:** Enterprise Internal Framework — **Khung sườn tái sử dụng** cho các ứng dụng nội bộ doanh nghiệp.
- **Mục đích:** Đây là một **template chuẩn (boilerplate)**, không phải dự án cụ thể. Mọi dự án mới khi khởi tạo từ framework này cần **sao chép (fork) và điền đầy đủ** thông tin vào các mục bên dưới.
- **Mục tiêu chính:**
  1. Cung cấp nền móng (Backend + Frontend) đã cấu hình sẵn, chạy được ngay.
  2. Ép buộc chất lượng code qua các công cụ tự động (Linter, Formatter, Security Scanner, CI/CD).
  3. Chuẩn hóa quy trình làm việc (Git, Review, Deploy) ngay từ đầu.
- **Đối tượng người dùng:** Dev Team nội bộ và các AI Agent làm việc trong dự án.

## 2. Cấu trúc thư mục quy tắc (Rules Structure)
Dự án áp dụng việc chia nhỏ các quy tắc thành các tệp `.md` riêng biệt để dễ quản lý, đọc và tái sử dụng:
- 📂 `rules/`
  - [`core_principles.md`](./rules/core_principles.md): Các quy tắc bắt buộc, nguyên tắc cốt lõi không được vi phạm.
  - [`design.md`](./rules/design.md): Quy tắc thiết kế (UI/UX, System Design).
  - [`workflow.md`](./rules/workflow.md): Quy trình làm việc (Git, CI/CD, Task management).
  - [`tech_task.md`](./rules/tech_task.md): Hướng dẫn quản lý và xử lý các task kỹ thuật.
  - [`coding_style.md`](./rules/coding_style.md): Chuẩn viết code, naming convention.
- 📂 `agents/`
  - [`backend_agent.md`](./agents/backend_agent.md): Agent chuyên viết API Python/FastAPI, bảo mật và cơ sở dữ liệu.
  - [`frontend_agent.md`](./agents/frontend_agent.md): Agent chuyên viết React, tối ưu hiệu năng.
  - [`reviewer_agent.md`](./agents/reviewer_agent.md): Agent kiểm tra chất lượng và bảo mật code.
- 📂 `skills/` (Các module/tác vụ có thể tái sử dụng)
  - [`karpathy-guidelines/SKILL.md`](./skills/karpathy-guidelines/SKILL.md): Nguyên tắc lập trình tránh lỗi thường gặp cho LLM (Simplicity First, Surgical Changes).

## 3. Tech Stack Mặc định (Default Stack)
> ❗ Khi fork framework này cho một dự án cụ thể, hãy cập nhật lại mục này cho đúng với lựa chọn thực tế.
- **Frontend:** React (Vite) + React Router + React Query (Tanstack) + Zustand
- **Backend:** Python 3.11+ / FastAPI + SQLAlchemy (ORM) + Pydantic
- **Database:** SQLite (Dev) → PostgreSQL (Production)
- **Auth:** JWT (JSON Web Token) + Bcrypt
- **Infrastructure:** Docker + GitHub Actions (CI/CD)
- **Code Quality:** Pre-commit + Black + Flake8 + Bandit + ESLint + Prettier + Commitlint

## 4. Hướng dẫn cốt lõi dành cho AI (AI SYSTEM INSTRUCTIONS)

> [!IMPORTANT]
> **Đây là lệnh bắt buộc (System Prompt) dành cho mọi trợ lý AI khi làm việc trong dự án này:**
> 
> 1. **BẮT BUỘC ĐỌC QUY TẮC:** Trước khi viết hoặc sửa bất kỳ đoạn code nào, AI **PHẢI** sử dụng công cụ đọc file (`view_file`) để xem lại nội dung các tệp trong thư mục `rules/` (như `core_principles.md`, `coding_style.md`, `design.md`).
> 2. **CẬP NHẬT BỐI CẢNH:** Luôn kiểm tra `memory.md` để nắm bắt công việc đang làm dở dang.
> 3. **TUÂN THỦ TUYỆT ĐỐI:** AI không được phép tự ý thay đổi format code, bỏ qua kiểm tra bảo mật, hoặc phá vỡ cấu trúc thư mục đã định sẵn. Nếu gặp trường hợp bắt buộc phải làm trái quy tắc, AI phải xin phép (Confirm) với User trước khi thực hiện.
> 4. **TRÌNH TỰ PHÁT TRIỂN (ROADMAP FIRST):** AI bắt buộc phải xem file `ROADMAP.md` trước khi code. Tuyệt đối BẮT BUỘC phải làm đúng trình tự các Giai đoạn. Cấm nhảy cóc làm tính năng ở Giai đoạn 2, 3 khi Giai đoạn 1 vẫn còn các ô trống `[ ]` chưa làm xong. Khi code xong tính năng nào, AI có nhiệm vụ tự động đánh dấu `[x]` vào ô tương ứng trong `ROADMAP.md`.
