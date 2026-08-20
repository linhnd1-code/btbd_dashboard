// Lớp gọi API dùng chung cho toàn bộ Fleet module — tương đương "Axios Interceptor" nhưng viết
// trên `fetch` gốc (dự án hiện không thực sự dùng axios ở đâu, xem package.json) để không phải
// thêm dependency mới chỉ cho 1 việc: tự đính kèm Bearer token + tự đăng xuất khi token hết hạn.
const TOKEN_KEY = 'fleet_token';
const USER_KEY = 'fleet_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Gọi khi 401 (token hết hạn/không hợp lệ) để mọi nơi trong app phản ứng giống nhau —
// AuthContext lắng nghe event này thay vì hardcode redirect ở đây, tránh vòng phụ thuộc ngược
// (httpClient vốn không nên biết gì về React Router).
function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent('fleet:session-expired'));
}

/**
 * fetch có đính kèm Authorization header (nếu đã đăng nhập) + tự parse JSON + tự ném lỗi rõ ràng.
 * Dùng cho MỌI lời gọi API trong module Fleet (cả nhóm `/fleet/*` và `/auth/*`).
 */
export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearSession();
    notifySessionExpired();
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || 'Yêu cầu thất bại');
  }
  return body;
}

export async function apiGet(url) {
  const body = await apiFetch(url);
  return body.data;
}

export async function apiSend(url, method, data) {
  const body = await apiFetch(url, { method, body: data !== undefined ? JSON.stringify(data) : undefined });
  return body.data;
}
