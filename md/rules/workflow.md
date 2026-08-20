# QUY TRÌNH LÀM VIỆC (WORKFLOW)

## 1. Quản lý Source Code (Git Workflow)
Dự án áp dụng quy trình Git có tổ chức để dễ dàng làm việc nhóm và release sản phẩm:
- `main` / `master`: Nhánh production. Chứa code đang chạy thực tế, tuyệt đối ổn định. Không bao giờ code trực tiếp trên nhánh này.
- `develop` (hoặc `staging`): Nhánh tổng hợp code từ các tính năng đang phát triển, dùng để test trước khi đưa lên production.
- `feature/<tên-tính-năng>`: Nhánh làm tính năng mới. Tách ra từ nhánh `develop`.
- `bugfix/<tên-bug>` hoặc `hotfix/<tên-bug>`: Nhánh sửa lỗi.

**Quy tắc Commit Message (Dựa theo Conventional Commits):**
Cấu trúc bắt buộc: `<type>[tùy_chọn_scope]: <Mô_tả_ngắn_gọn>`
- `feat`: Thêm tính năng mới (vd: `feat(auth): thêm đăng nhập bằng Google`)
- `fix`: Sửa lỗi (vd: `fix: sửa lỗi crash khi bấm nút Submit`)
- `docs`: Cập nhật tài liệu (`README`, `.md`)
- `style`: Thay đổi format (khoảng trắng, dấu phẩy, css...)
- `refactor`: Refactor code logic nhưng không đổi hành vi
- `test`: Thêm hoặc sửa test

## 2. Quy trình CI/CD (Nếu có)
- Mỗi khi đẩy code hoặc tạo Pull Request (PR) lên `develop` / `main`, hệ thống tự động sẽ:
  1. Chạy Linter & Formatter.
  2. Chạy Unit Tests tự động.
  3. Kiểm tra xem build có thành công không.
- Nếu 1 trong 3 bước trên thất bại (Dấu X đỏ), developer phải sửa ngay lập tức, code không được phép merge.

## 3. Quy trình Code Review
- Developer tạo Pull Request (PR) cần đảm bảo PR nhỏ gọn, tập trung vào 1 mục tiêu duy nhất để dễ review.
- PR cần mô tả rõ ràng thay đổi đã thực hiện.
- Khi yêu cầu Review, bắt buộc phải dùng `pull_request_template.md` để tự kiểm tra.
- Code chỉ được merge khi thỏa mãn cả 3 điều kiện:
  1. Pipeline CI/CD trên Github/Gitlab báo Xanh (Pass Linter, Security & Test).
  2. Vượt qua vòng soi lỗi gắt gao của AI (`agents/reviewer_agent.md` trả về APPROVED).
  3. Có Approve từ ít nhất 1 thành viên con người (hoặc Tech Lead).
- Reviewer cần để lại comment rõ ràng, mang tính xây dựng. Thay vì nói "Code này sai rồi", hãy nói "Nên dùng map() ở đây thay cho vòng lặp for để code ngắn và an toàn hơn".
