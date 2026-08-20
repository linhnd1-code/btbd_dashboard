import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/fleet-theme.css';
import { useAuth } from './AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    // Kiểm tra sớm ở Frontend cho trải nghiệm mượt hơn — nhưng KHÔNG thay thế validate ở
    // Backend (schemas/auth.py cũng chặn domain + độ dài mật khẩu), vì client luôn có thể bị qua mặt.
    if (!form.email.trim().toLowerCase().endsWith('@ghn.vn')) {
      setError('Chỉ chấp nhận email công ty Giao Hàng Nhanh (đuôi @ghn.vn)');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({ email: form.email.trim(), password: form.password, full_name: form.full_name.trim() });
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fleet-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form onSubmit={onSubmit} className="card" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <h1 style={{ marginBottom: 2 }}>Đăng ký tài khoản</h1>
          <div className="text-muted" style={{ fontSize: 12.5 }}>Chỉ dành cho email công ty @ghn.vn — tài khoản mới cần Quản trị viên phê duyệt.</div>
        </div>

        {message ? (
          <>
            <div style={{ color: '#16a34a', fontSize: 13.5, lineHeight: 1.5 }}>{message}</div>
            <Link to="/fleet/login" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <>
            <div className="field">
              <label>Họ và tên</label>
              <input className="input" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            </div>
            <div className="field">
              <label>Email công ty</label>
              <input
                className="input"
                type="email"
                required
                placeholder="ten.ban@ghn.vn"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mật khẩu (tối thiểu 8 ký tự)</label>
              <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} />
            </div>
            <div className="field">
              <label>Nhập lại mật khẩu</label>
              <input className="input" type="password" required value={form.confirm} onChange={(e) => update('confirm', e.target.value)} />
            </div>

            {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Đang gửi...' : 'Đăng ký'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12.5 }}>
              Đã có tài khoản? <Link to="/fleet/login">Đăng nhập</Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
