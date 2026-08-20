export const COLORS = {
  accent: '#3b82f6',
  accent2: '#d6006c',
  good: '#16a34a',
  warning: '#edbb00',
  critical: '#e5484d',
  neutral: '#9aa1ab',
};

const VEHICLE_STATUS_META = {
  'Hoạt động': { label: 'Đang hoạt động', color: COLORS.good, bg: '#dcfce7' },
  'Hết đăng kiểm': { label: 'Hết đăng kiểm', color: COLORS.critical, bg: '#fee2e2' },
  'SC bảo hiểm': { label: 'Sửa chữa bảo hiểm', color: COLORS.warning, bg: '#fef3c7' },
  'Thanh lý': { label: 'Đã thanh lý', color: COLORS.neutral, bg: '#f1f5f9' },
};

export function vehicleStatusMeta(status) {
  return (
    VEHICLE_STATUS_META[status] || {
      label: status || 'Không rõ',
      color: COLORS.neutral,
      bg: '#f1f5f9',
    }
  );
}

const DOC_STATUS_META = {
  ok: { label: 'Còn hạn', color: COLORS.good, bg: '#dcfce7' },
  soon: { label: 'Sắp hết hạn', color: '#8a6d00', bg: '#fef3c7' },
  expired: { label: 'Đã hết hạn', color: COLORS.critical, bg: '#fee2e2' },
};

export function docStatusMeta(status) {
  return DOC_STATUS_META[status] || DOC_STATUS_META.ok;
}

const SCHEDULE_STATUS_META = {
  overdue: { label: 'Quá hạn', color: COLORS.critical, bg: '#fee2e2' },
  due: { label: 'Đến kỳ BD', color: COLORS.warning, bg: '#fef3c7' },
  upcoming: { label: 'Sắp tới', color: COLORS.accent, bg: '#dbeafe' },
  ok: { label: 'Còn xa', color: COLORS.good, bg: '#dcfce7' },
};

export function scheduleStatusMeta(status) {
  return SCHEDULE_STATUS_META[status] || SCHEDULE_STATUS_META.ok;
}

export function fmtInt(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function fmtVnd(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
}

const HANOI_TZ = 'Asia/Ho_Chi_Minh';

// Ưu tiên đọc trực tiếp phần YYYY-MM-DD từ chuỗi gốc (không qua Date/múi giờ) vì
// các mốc hạn giấy tờ/ngày vào xưởng chỉ là NGÀY LỊCH, không mang ý nghĩa thời
// điểm tuyệt đối — quy đổi qua múi giờ có thể lệch ngày ở các trường hợp biên.
export function fmtDate(value) {
  if (!value) return '-';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', { timeZone: HANOI_TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

// Dùng cho các mốc THỜI ĐIỂM thật (đồng bộ dữ liệu...) — luôn quy đổi và hiển thị
// theo giờ Hà Nội (UTC+07:00), không phụ thuộc múi giờ máy/trình duyệt người xem.
export function fmtDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const datePart = new Intl.DateTimeFormat('en-GB', { timeZone: HANOI_TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const timePart = new Intl.DateTimeFormat('en-GB', { timeZone: HANOI_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
  return `${datePart} ${timePart}`;
}

export function lastMonths(arr, n = 6) {
  return arr.slice(-n);
}

export function fmtMonthLabel(label) {
  const [year, month] = String(label).split('-');
  return month && year ? `${month}-${year}` : label;
}

export function healthBand(score) {
  if (score >= 85) return { label: 'Xuất sắc', color: '#16a34a', bg: '#dcfce7' };
  if (score >= 70) return { label: 'Tốt', color: '#3b82f6', bg: '#dbeafe' };
  if (score >= 50) return { label: 'Cảnh báo', color: '#f59e0b', bg: '#fef3c7' };
  return { label: 'Nguy cấp', color: '#e5484d', bg: '#fee2e2' };
}

export function daysLabel(days) {
  if (days === null || days === undefined) return '-';
  if (days === 0) return 'Hôm nay';
  return `${days} ngày`;
}
