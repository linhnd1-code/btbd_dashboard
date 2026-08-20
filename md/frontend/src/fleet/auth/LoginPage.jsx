import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/fleet-theme.css';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/fleet', { replace: true });
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
          <div
            style={{
              width: 46, height: 46, margin: '0 auto 12px', borderRadius: 12,
              background: 'linear-gradient(135deg,#3b6df0,#8a5cf6)', display: 'grid', placeItems: 'center',
            }}
          >
            <i className="ph-duotone ph-truck" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <h1 style={{ marginBottom: 2 }}>Đăng nhập</h1>
          <div className="text-muted" style={{ fontSize: 12.5 }}>Fleet Dashboard — Quản lý đội xe GHN</div>
        </div>

        <div className="field">
          <label>Email công ty</label>
          <input
            className="input"
            type="email"
            required
            autoFocus
            placeholder="ten.ban@ghn.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Mật khẩu</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12.5 }}>
          Chưa có tài khoản? <Link to="/fleet/register">Đăng ký bằng email @ghn.vn</Link>
        </div>
      </form>
    </div>
  );
}
