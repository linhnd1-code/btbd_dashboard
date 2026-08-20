import { apiFetch, apiGet, apiSend } from './httpClient';

const AUTH_BASE = '/api/v1/auth';

export async function login(email, password) {
  const body = await apiFetch(`${AUTH_BASE}/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
  return body.data; // { access_token, token_type, user }
}

export async function register({ email, password, full_name }) {
  const body = await apiFetch(`${AUTH_BASE}/register`, { method: 'POST', body: JSON.stringify({ email, password, full_name }) });
  return body; // { status, message, data: user } — cần message để hiển thị "chờ duyệt"
}

export function fetchMe() {
  return apiGet(`${AUTH_BASE}/me`);
}

export function changeMyPassword(old_password, new_password) {
  return apiSend(`${AUTH_BASE}/me/password`, 'PUT', { old_password, new_password });
}

export function listUsers() {
  return apiGet(`${AUTH_BASE}/users`);
}

export function updateUser(userId, patch) {
  return apiSend(`${AUTH_BASE}/users/${userId}`, 'PATCH', patch);
}
