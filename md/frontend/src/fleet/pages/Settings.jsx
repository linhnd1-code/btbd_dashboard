import { useEffect, useState } from 'react';
import { fetchSettings, saveSettings } from '../api';
import { useAuth } from '../auth/AuthContext';
import Loading from '../components/Loading';
import UserManagementPanel from '../components/UserManagementPanel';

export default function Settings() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings().then(setForm).catch((e) => setError(e.message));
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveSettings({
        expiry_alert_window_days: parseInt(form.expiry_alert_window_days, 10),
        due_threshold_km: parseInt(form.due_threshold_km, 10),
        upcoming_threshold_km: parseInt(form.upcoming_threshold_km, 10),
      });
      setForm(saved);
      setMessage('Đã lưu cài đặt — áp dụng ngay cho toàn bộ cảnh báo & điểm sức khỏe.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !form) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!form) return <Loading />;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Cài đặt ngưỡng cảnh báo</h1>
      <div style={{ fontSize: 12.5, color: '#7a828e', marginBottom: 16 }}>
        Các ngưỡng này áp dụng cho toàn bộ module Fleet: Tổng quan, Hồ sơ giấy tờ, Lịch bảo dưỡng, Điểm sức khỏe xe.
        {!isAdmin && ' Chỉ Quản trị viên mới được sửa các ngưỡng này — bạn đang xem ở chế độ chỉ đọc.'}
      </div>

      <fieldset disabled={!isAdmin} style={{ border: 'none', padding: 0, margin: 0 }}>
        <form onSubmit={onSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
          <div className="field">
            <label>Ngưỡng cảnh báo giấy tờ sắp hết hạn (ngày)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.expiry_alert_window_days}
              onChange={(e) => update('expiry_alert_window_days', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Ngưỡng "đến kỳ bảo dưỡng" (km còn lại)</label>
            <input className="input" type="number" min="0" value={form.due_threshold_km} onChange={(e) => update('due_threshold_km', e.target.value)} />
          </div>
          <div className="field">
            <label>Ngưỡng "sắp đến kỳ bảo dưỡng" (km còn lại)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.upcoming_threshold_km}
              onChange={(e) => update('upcoming_threshold_km', e.target.value)}
            />
          </div>

          {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}
          {message && <div style={{ color: '#16a34a', fontSize: 13 }}>{message}</div>}

          {isAdmin && (
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          )}
        </form>
      </fieldset>

      {isAdmin && <UserManagementPanel />}
    </div>
  );
}
