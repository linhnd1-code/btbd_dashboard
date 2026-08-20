# QUY TẮC THIẾT KẾ (DESIGN RULES)

Tệp này quy định các chuẩn mực về thiết kế giao diện (UI/UX) cũng như kiến trúc hệ thống (System Design).

## 1. Nguyên tắc Giao diện và Trải nghiệm (UI/UX)
- **Tính đồng nhất (Consistency):** Mọi giao diện, nút bấm, màu sắc, font chữ phải tuân thủ chặt chẽ Design System / Bảng màu đã thống nhất của dự án. Không tự ý sử dụng các mã màu lạ.
- **Tối giản (Minimalism & Clarity):** Giữ giao diện sạch sẽ, tập trung vào nội dung và hành động chính, khoảng trắng (whitespace) hợp lý. Tránh nhồi nhét chi tiết rườm rà.
- **Phản hồi tức thì (Interactive Feedback):** Mọi tương tác của người dùng (click, hover, submit, lỗi) đều phải có phản hồi trực quan (loading state, toast notification, micro-animations, disable button).
- **Responsive (Đa thiết bị):** Giao diện bắt buộc phải hiển thị tốt, không bị vỡ layout trên đa thiết bị (Mobile, Tablet, Desktop) - Ưu tiên Mobile-first.

## 2. Thiết kế Hệ thống (System Architecture)
- **Tách biệt quan tâm (Separation of Concerns):** Phân chia logic rõ ràng giữa Data Layer (Database), Business Logic Layer (Services/Controllers) và Presentation Layer (UI/Views).
- **API Design Guidelines:**
  - Thiết kế API tuân thủ chuẩn RESTful API.
  - Sử dụng chính xác HTTP Methods (`GET` cho lấy dữ liệu, `POST` tạo mới, `PUT/PATCH` cập nhật, `DELETE` xóa).
  - Trả về HTTP Status Codes chuẩn xác (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Server Error`).
  - Response format phải đồng nhất.
- **Database Design:**
  - Thiết kế chuẩn hóa (Normalization) để giảm thiểu dư thừa dữ liệu, nhưng có thể denormalize (phi chuẩn hóa) có kiểm soát nếu cần hiệu năng đọc lớn.
  - Xây dựng sơ đồ ERD rõ ràng trước khi tạo bảng.
