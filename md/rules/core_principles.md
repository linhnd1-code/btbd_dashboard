# QUY TẮC BẮT BUỘC (CORE PRINCIPLES)

Đây là các nguyên tắc tối thượng của dự án. Bất kỳ đoạn code, luồng logic hay kiến trúc nào được tạo ra đều PHẢI tuân thủ tuyệt đối các quy tắc này.

## 1. Tính bảo mật (Security First)
- KHÔNG BAO GIỜ hardcode các thông tin nhạy cảm (API keys, passwords, tokens, DB credentials) vào source code. Luôn sử dụng biến môi trường (`.env` hoặc Secret Manager).
- Mọi API endpoint nhận dữ liệu từ client đều phải được xác thực (Authentication), phân quyền (Authorization) và validate dữ liệu đầu vào.
- Chủ động phòng chống các lỗ hổng OWASP Top 10 (SQL Injection, XSS, CSRF, v.v.).

## 2. Hiệu suất (Performance)
- Database: Tránh các truy vấn N+1, đảm bảo các trường hay search/filter phải được đánh Index (Chỉ mục).
- Frontend: Tối ưu hóa bundle size, áp dụng lazy loading, tránh render lại (re-render) không cần thiết.
- Thuật toán: Code phải được ưu tiên viết với độ phức tạp thuật toán thấp (ưu tiên O(1) hoặc O(n) thay vì O(n^2) nếu có thể).

## 3. Khả năng bảo trì (Maintainability)
- Áp dụng triệt để nguyên lý SOLID và DRY (Don't Repeat Yourself).
- "Code được viết để cho con người đọc trước, máy móc đọc sau".
- Naming convention (cách đặt tên) phải rõ ràng, bộc lộ ý định của biến/hàm.
- Mọi đoạn code phức tạp, khó hiểu bắt buộc phải đi kèm comment giải thích TẠI SAO lại làm như vậy (Why), chứ không phải đoạn code đó LÀM GÌ (What).

## 4. Kiểm thử (Testing & QA)
- Bất kì một tính năng quan trọng nào mới thêm vào đều phải có Unit Test đi kèm.
- Không được merge code nếu CI/CD pipeline (nếu có) báo lỗi hoặc fail test.
- Phải test kỹ edge cases (các trường hợp ngoại lệ) trước khi đẩy code.
