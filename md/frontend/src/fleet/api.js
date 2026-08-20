// Đường dẫn tương đối — dev/preview server proxy "/api" sang backend (xem
// vite.config.js). Nhờ vậy trang chạy đúng dù mở qua localhost, IP LAN, hay
// một tunnel công khai (Cloudflare Tunnel...) chỉ trỏ vào 1 cổng duy nhất.
import { apiGet, apiSend } from './httpClient';

const API_BASE = '/api/v1/fleet';

export function fetchFleetStats() {
  return apiGet(`${API_BASE}/stats`);
}

export function fetchFleetAlerts(limit = 10) {
  return apiGet(`${API_BASE}/alerts?limit=${limit}`);
}

export function fetchMaintenanceRecords({ page = 1, pageSize = 10, plateNumber = '' } = {}) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (plateNumber) params.set('plate_number', plateNumber);
  return apiGet(`${API_BASE}/records?${params.toString()}`);
}

export function fetchVehicles({ status = '', brand = '', search = '' } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (brand) params.set('brand', brand);
  if (search) params.set('search', search);
  const qs = params.toString();
  return apiGet(`${API_BASE}/vehicles${qs ? `?${qs}` : ''}`);
}

export function fetchDocuments(docType = '') {
  const qs = docType ? `?doc_type=${encodeURIComponent(docType)}` : '';
  return apiGet(`${API_BASE}/documents${qs}`);
}

export function fetchMaintenanceSchedule() {
  return apiGet(`${API_BASE}/maintenance-schedule`);
}

export function fetchVehicleLookup(plateNumber) {
  return apiGet(`${API_BASE}/vehicle/${encodeURIComponent(plateNumber)}`);
}

export function fetchSettings() {
  return apiGet(`${API_BASE}/settings`);
}

export function saveSettings(data) {
  return apiSend(`${API_BASE}/settings`, 'PUT', data);
}

export function fetchHealthScores() {
  return apiGet(`${API_BASE}/health-scores`);
}

export function fetchSmartAlerts() {
  return apiGet(`${API_BASE}/smart-alerts`);
}

export function fetchRoadsideIncidents() {
  return apiGet(`${API_BASE}/roadside-incidents`);
}

export function fetchReports(period = 'week') {
  return apiGet(`${API_BASE}/reports?period=${period}`);
}

export function syncSheet() {
  return apiSend(`${API_BASE}/sync`, 'POST');
}

export function fetchSyncStatus() {
  return apiGet(`${API_BASE}/sync-status`);
}

export function fetchOverviewExtra() {
  return apiGet(`${API_BASE}/overview-extra`);
}

export function fetchMaintenanceTrack() {
  return apiGet(`${API_BASE}/maintenance-track`);
}

export function fetchRepairTrack() {
  return apiGet(`${API_BASE}/repair-track`);
}

export function fetchPerformance() {
  return apiGet(`${API_BASE}/performance`);
}

export function fetchCompare(plates) {
  return apiGet(`${API_BASE}/compare?plates=${encodeURIComponent(plates.join(','))}`);
}

export function createMaintenanceRecord(data) {
  return apiSend(`${API_BASE}/records`, 'POST', data);
}
