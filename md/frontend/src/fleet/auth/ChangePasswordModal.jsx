import { useState } from 'react';
import { useAuth } from './AuthContext';

/**
 * `forced`=true (must_change_password) → không cho bấm ra ngoài để đóng, không có nút Huỷ —
 * dùng cho tài khoản Admin được seed sẵn mật khẩu, bắt buộc đổi trước khi dùng tiếp.
 * `forced`=false → modal đổi mật khẩu bình thường, có thể đóng (mở từ menu user ở TopBar).
 */
export default function ChangePasswordModal({ forced = false, onClose }) {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) {
      setError('Mật khẩu mới nhập lại không khớp');
      return;
    }
    setSaving(true);
    try {
      await changePassword(form.old_password, form.new_password);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,18,28,.5)', zIndex: 90,
        display: 'grid', placeItems: 'center', padding: 20,
      }}
      onClick={forced ? undefined : onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <h3 style={{ marginBottom: 0 }}>Đổi mật khẩu</h3>
        {forced && (
          <div className="text-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
            Tài khoản của bạn đang dùng mật khẩu tạm — vui lòng đặt mật khẩu mới trước khi tiếp tục sử dụng hệ thống.
          </div>
        )}

        <div className="field">
          <label>Mật khẩu hiện tại</label>
          <input className="input" type="password" required value={form.old_password} onChange={(e) => update('old_password', e.target.value)} />
        </div>
        <div className="field">
          <label>Mật khẩu mới (tối thiểu 8 ký tự)</label>
          <input className="input" type="password" required minLength={8} value={form.new_password} onChange={(e) => update('new_password', e.target.value)} />
        </div>
        <div className="field">
          <label>Nhập lại mật khẩu mới</label>
          <input className="input" type="password" required value={form.confirm} onChange={(e) => update('confirm', e.target.value)} />
        </div>

        {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {!forced && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Huỷ
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}
