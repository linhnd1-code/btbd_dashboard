# QUẢN LÝ VÀ XỬ LÝ TECH TASK

Hướng dẫn chi tiết cách tiếp cận, phân tích và thực thi một Technical Task một cách bài bản nhất trong dự án.

## 1. Quy trình xử lý một Task
Bất kì developer hay trợ lý AI nào khi tiếp nhận task đều nên đi qua các bước:
1. **Phân tích yêu cầu (Requirement Analysis):** Đọc kỹ mô tả task, xác định rõ dữ liệu đầu vào (Input), đầu ra (Output), và đặc biệt là các trường hợp ngoại lệ (Edge cases).
2. **Thiết kế giải pháp (Solution Design):** Phác thảo cách giải quyết, xác định các hàm/class cần tạo mới hoặc cần sửa đổi ở file nào.
3. **Thực thi (Implementation):** Bắt đầu viết code theo giải pháp đã chốt. Tuân thủ `coding_style.md`.
4. **Kiểm thử (Testing):** Tự test (Manual test) ở các kịch bản thành công và thất bại. Viết Unit Test nếu có yêu cầu.
5. **Review & Refactor:** Xem xét lại code, dọn dẹp các dòng code rác (`console.log`, code thừa), tối ưu hóa lại thuật toán và đặt lại tên biến nếu cần.

## 2. Tiêu chuẩn hoàn thành (Definition of Done - DoD)
Một task chỉ được coi là hoàn thành khi:
- ✔️ Code chạy đúng theo toàn bộ yêu cầu (Acceptance Criteria) mô tả trong ticket.
- ✔️ Không phá hỏng bất kì tính năng cũ nào đang hoạt động.
- ✔️ Đã xử lý các trường hợp lỗi (Error Handling), không văng lỗi unhandled.
- ✔️ Không có cảnh báo hoặc lỗi báo từ Linter/Compiler.
- ✔️ CI/CD Pipeline (GitHub Actions) báo **Xanh** (Pass Linter, Security & Test).
- ✔️ AI Reviewer (`agents/reviewer_agent.md`) trả về kết quả **🟢 APPROVED**.
- ✔️ Đã tự review code của chính mình và điền đầy đủ checklist trong `pull_request_template.md`.
- ✔️ (Tùy chọn) Đã cập nhật tài liệu liên quan nếu thay đổi kiến trúc/API.

## 3. Cấu trúc chuẩn khi báo cáo Task
Khi thảo luận hoặc tạo issue, nội dung cần có:
- **Ngữ cảnh (Context):** Đang làm tính năng gì? Hoặc Bug xuất hiện ở đâu?
- **Chi tiết:** Các bước tái hiện bug, hoặc các yêu cầu cụ thể của tính năng.
- **Dự kiến kết quả (Expected Behavior):** Chuyện gì lẽ ra phải xảy ra?
- **Tài liệu đính kèm:** Hình ảnh lỗi, link Figma, snippet code liên quan.
