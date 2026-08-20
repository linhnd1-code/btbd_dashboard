# Dashboard Bảo trì đội xe (Fleet / BTBD) — Mô tả toàn bộ

Module quản lý đội xe thực tế, cắm vào khung sườn enterprise ở shell riêng `/fleet/*`
(sidebar "FLEET OPS"). Toàn bộ số liệu là dữ liệu thật hoặc suy ra minh bạch từ dữ
liệu thật — không có số liệu bịa. Ở những nơi không có dữ liệu thật để tính (ví dụ
nhiên liệu, uptime động cơ), tính năng đó không hiển thị hoặc ghi rõ chú thích giới hạn.

## 1. Nguồn dữ liệu & đồng bộ

- **Nguồn**: Google Sheet "M12 Data bot btbd 1", chia sẻ công khai dạng "Anyone with
  link can view" — tải trực tiếp qua URL export XLSX, không cần service account.
- **3 bảng dùng thật**: `Lịch sử Bảo dưỡng - sửa chữa` (nhật ký BTBD), `Data xe`
  (danh sách xe), `Data BTBD` (theo dõi ODO/kỳ bảo dưỡng). 1 bảng trùng lặp trong
  Sheet bị bỏ qua có chủ đích.
- **Tự động đồng bộ mỗi 60 giây** (`backend/main.py`, `SHEET_SYNC_INTERVAL_SECONDS`)
  — xoá và nạp lại toàn bộ 3 bảng từ Sheet (không cộng dồn). Đồng bộ chạy song song
  (thread pool) để không chặn API.
- Topbar có **thanh trạng thái đồng bộ** (chấm xanh + đếm ngược thời gian đến lần
  đồng bộ kế tiếp) và nút **"Làm mới"** kích hoạt đồng bộ ngay lập tức, không chỉ tải
  lại trang.
- Toàn bộ mốc thời gian tính theo **giờ Hà Nội (UTC+07:00)** (`backend/core/timezone.py`),
  không phụ thuộc múi giờ máy chủ đang chạy.

## 2. Kiến trúc kỹ thuật

- **Backend**: FastAPI + SQLAlchemy + SQLite. Toàn bộ endpoint dưới `/api/v1/fleet`.
  Logic nghiệp vụ tập trung ở `services/fleet_service.py` + `services/sheet_sync.py`.
- **Frontend**: React + Vite, toàn bộ nằm trong `frontend/src/fleet/` (tự chứa, dễ
  gỡ như 1 module riêng). Biểu đồ (Donut/Bars/GroupedBars/ProportionBar) tự vẽ bằng
  SVG thuần, không dùng thư viện chart ngoài.
- Frontend gọi API qua đường dẫn tương đối `/api/v1/fleet` (Vite proxy `/api` sang
  backend) — chạy đúng dù mở qua `localhost`, IP LAN, hay qua tunnel.

## 3. Cấu trúc điều hướng & mô tả từng trang

### Tổng quan (`/fleet`)
- 10 thẻ KPI: tổng số xe, xe hoạt động/ngừng hoạt động, xe đến kỳ/trễ bảo dưỡng,
  đăng kiểm/bảo hiểm hết hạn, tổng chi phí tuần/tháng/năm (tính theo ngày hệ thống
  hiện tại, giờ Hà Nội).
- Lưới 2 hàng × 3 cột: donut "Trạng thái hoạt động xe" · biểu đồ "Chi phí sửa chữa
  theo tháng" · "Cảnh báo quan trọng" (hàng 1); donut "Sức khỏe đội xe" (điểm trung
  bình thật) · biểu đồ nhóm "Chi phí vận hành theo tháng" (4 hạng mục) · "Tổng ODO
  ghi nhận theo tháng" (hàng 2, có chú thích rõ đây không phải quãng đường thực đi
  trong tháng).
- Biểu đồ theo tháng mặc định chỉ hiện **6 tháng gần nhất**.

### Thông tin xe
- **Tổng quan đội xe** (`/doi-xe`): thống kê phân bổ theo bộ phận/hãng xe/tuổi xe.
- **Danh sách xe** (`/danh-sach-xe`): bảng toàn bộ xe, lọc theo trạng thái, tìm theo
  biển số.
- **Hồ sơ giấy tờ** (`/giay-to`): toàn bộ 6 loại giấy tờ (đăng kiểm, phí đường bộ,
  đăng ký, BH dân sự, BH vật chất, phù hiệu) của mọi xe, đúng 3 trạng thái chuẩn
  **Còn hạn / Sắp hết hạn / Đã hết hạn** (ngưỡng "sắp hết hạn" tùy chỉnh ở Cài đặt).
- **Kế hoạch đăng kiểm** (`/dang-kiem`): riêng cho "Hạn đăng kiểm", 3 khối theo đúng
  ngưỡng cấu hình thật (không hard-code số ngày).

### Bảo dưỡng · Sửa chữa
- **Tổng quan** (`/bdsc`): KPI + biểu đồ chung.
- **Theo dõi bảo dưỡng** (`/theo-doi-bao-duong`): tỷ lệ tuân thủ, xu hướng đúng
  hạn/chi phí/số lượt theo tháng, độ lệch km theo bộ phận/hãng xe, top xe trễ/sớm
  hạn nhất, nhúng kèm bảng "Kế hoạch bảo dưỡng" ưu tiên theo mức độ.
- **Theo dõi sửa chữa** (`/theo-doi-sua-chua`): KPI, chi phí theo bộ phận/hãng xe,
  xu hướng theo tháng, tần suất theo loại việc, Top 20 chi phí cao/Top 20 sửa nhiều
  lần, nhúng kèm nhật ký sửa chữa chi tiết (tìm + phân trang).
- **Phiếu bảo dưỡng** (`/phieu-bao-duong`): form tạo lượt BTBD mới thật, ghi thẳng
  vào DB qua `POST /records`.
- **Sửa chữa dọc đường** (`/doc-duong`): phát hiện bằng khớp từ khoá thật trên cột
  ghi chú/chi tiết (`cứu hộ, cứu pan, dọc đường, lưu động, kéo xe`) — không phải
  danh mục riêng có sẵn trong Sheet nguồn.

### Các trang top-level khác
- **Hiệu suất đội xe** (`/hieu-suat`): giờ nằm xưởng tính từ cột "Tổng giờ" trong
  nhật ký thật; không hiển thị chỉ số nhiên liệu/uptime vì Sheet không có dữ liệu đó.
- **Điểm sức khỏe xe** (`/diem-suc-khoe`): bảng điểm toàn đội, công thức 100% rule-based
  (xem mục 4), khai báo rõ "không phải AI".
- **Hồ sơ chi tiết xe** (`/xe/:plate`): thông tin xe, giấy tờ & hạn, lịch sử BTBD gần
  đây, cũng truy cập qua click biển số ở bất kỳ đâu trong app.
- **So sánh đội xe** (`/so-sanh-doi-xe`): xếp hạng toàn đội theo bộ phận/hãng xe, 4
  bảng Top 20 (chi phí, số lần sửa chữa, chi phí/km — có ghi rõ là ước tính trọn đời
  xe theo ODO hiện tại, giờ nằm xưởng).
- **Báo cáo** (`/bao-cao`): theo tuần/tháng, xem toàn bộ lịch sử (không giới hạn 6
  tháng như Tổng quan).
- **AI & Analytics** (`/ai-analytics`): cảnh báo tổng hợp **rule-based**, khai báo rõ
  không phải AI/machine learning (xem mục 4).
- **Cài đặt** (`/cai-dat`): 3 ngưỡng cấu hình thật, áp dụng ngay toàn hệ thống —
  ngưỡng cảnh báo giấy tờ sắp hết hạn (ngày), ngưỡng "đến kỳ"/"sắp đến kỳ" bảo dưỡng
  (km còn lại).

### Tra cứu (gộp vào topbar, không còn là mục sidebar riêng)
- Ô tìm nhanh: nhập biển số đầy đủ hoặc vài số cuối, có gợi ý tự động (autocomplete)
  khi gõ.
- **Quét biển số bằng camera**: OCR thật chạy trên trình duyệt (`tesseract.js`, không
  gửi ảnh lên server), có khung dẫn để canh biển số.
- **Tìm bằng giọng nói**: Web Speech API thật của trình duyệt (Chrome/Edge).
- Kết quả điều hướng tới trang Tra cứu biển số (`/tra-cuu`) hoặc Hồ sơ chi tiết xe.

## 4. Công thức & logic quan trọng (đều rule-based, không phải AI/ML)

**Điểm sức khỏe xe** = 40% tuân thủ bảo dưỡng + 25% tần suất sửa chữa + 20% tình
trạng BD hiện tại + 15% hồ sơ giấy tờ:
- Tuân thủ: % lượt "Đúng định mức" trong các lượt BTBD có kiểm tra (mặc định 80 nếu
  chưa có lượt nào được kiểm tra).
- Tần suất: xe có số lượt sửa chữa cao hơn trung bình đội xe bị trừ điểm (mỗi lượt
  vượt trung bình trừ 15 điểm).
- Tình trạng BD: trừ điểm nếu đã vượt mốc ODO bảo dưỡng.
- Hồ sơ giấy tờ: 100 điểm nếu không giấy tờ nào sắp/đã hết hạn, ngược lại 40 điểm.

**Trạng thái hạn giấy tờ** (`_days_remaining` + ngưỡng `expiry_alert_window_days`):
- `days_remaining < 0` → **Đã hết hạn**
- `0 ≤ days_remaining ≤ ngưỡng` → **Sắp hết hạn**
- còn lại → **Còn hạn**

**Cảnh báo tổng hợp (AI & Analytics)** — 3 luật đơn giản, minh bạch:
- Chi phí BTBD trung bình/lượt của xe > 1.8× trung bình đội xe (và có ≥5 lượt) →
  cảnh báo "Chi phí cao bất thường".
- Xe có ≥6 lượt sửa chữa trong dữ liệu hiện có → "Sửa chữa lặp lại nhiều lần".
- Xe vượt mốc bảo dưỡng >1.000km → "Quá hạn bảo dưỡng nhiều".

**Chủ động KHÔNG làm**: sparkline/% delta theo ngày trên KPI, vì không có snapshot
lịch sử theo ngày để tính delta thật — làm giả sẽ vi phạm nguyên tắc không bịa số.

## 5. Danh sách API (`/api/v1/fleet`)

`stats`, `records` (GET/POST), `alerts`, `vehicles`, `documents`,
`maintenance-schedule`, `vehicle/{plate}`, `settings` (GET/PUT), `health-scores`,
`smart-alerts`, `roadside-incidents`, `overview-extra`, `maintenance-track`,
`repair-track`, `reports`, `performance`, `compare`, `sync` (POST), `sync-status`.

## 6. Hạn chế đã biết (minh bạch, chưa xử lý)

- Bộ lọc "Khoảng thời gian" ở FilterBar toàn cục chưa có tác dụng lên các biểu đồ
  theo tháng ở Tổng quan/Theo dõi BD/Theo dõi SC (3 endpoint `overview-extra`,
  `repair-track`, `maintenance-track` chưa nhận tham số ngày lọc).
- Chưa có đăng nhập/phân quyền — ai có link đều xem được toàn bộ dữ liệu.
- Chưa deploy lên hạ tầng cố định — hiện chỉ truy cập qua `localhost`/LAN của máy
  chạy dev (chi tiết xem `memory.md`, mục cập nhật 2026-08-04/05).

---
*Tài liệu tự động tổng hợp từ toàn bộ quá trình xây dựng module — xem `memory.md` ở
gốc thư mục `md/` để có lịch sử chi tiết từng quyết định, bug đã sửa, và gotcha kỹ
thuật theo từng ngày.*
