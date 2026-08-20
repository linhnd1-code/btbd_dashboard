import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSmartAlerts, fetchFleetAlerts, fetchVehicles, syncSheet } from '../api';
import { exportCsv } from '../csvExport';
import { useFleet } from '../FleetContext';
import { useAuth } from '../auth/AuthContext';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import PlateScanModal from './PlateScanModal';
import SyncIndicator from './SyncIndicator';

const ROLE_LABEL = { admin: 'Quản trị viên', manager: 'Quản lý', viewer: 'Người xem' };

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);

  function onLogout() {
    setOpen(false);
    logout();
    navigate('/fleet/login', { replace: true });
  }

  const initial = (user.full_name || user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={user.email}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 10px 0 4px',
          border: '1px solid var(--color-divider)', background: '#fff', borderRadius: 9, cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none',
            background: 'linear-gradient(135deg,#3b6df0,#8a5cf6)', color: '#fff', font: '700 12px var(--font-heading)',
          }}
        >
          {initial}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.full_name || user.email}
        </span>
        <i className="ph-bold ph-caret-down" style={{ fontSize: 10, opacity: 0.6 }} />
      </button>

      {open && (
        <div
          className="flt-page"
          style={{
            position: 'absolute', top: 44, right: 0, width: 220, background: '#fff', border: '1px solid var(--color-divider)',
            borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 55, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f1f4' }}>
            <div style={{ font: '600 13px var(--font-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.full_name || user.email}
            </div>
            <div style={{ fontSize: 11, color: '#9aa1ab' }}>{user.email}</div>
            <div style={{ fontSize: 11, color: '#3b6df0', fontWeight: 600, marginTop: 3 }}>{ROLE_LABEL[user.role] || user.role}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setChangePwOpen(true);
            }}
            style={menuItemStyle}
          >
            <i className="ph-duotone ph-key" style={{ fontSize: 15 }} /> Đổi mật khẩu
          </button>
          <button type="button" onClick={onLogout} style={{ ...menuItemStyle, color: '#e5484d' }}>
            <i className="ph-duotone ph-sign-out" style={{ fontSize: 15 }} /> Đăng xuất
          </button>
        </div>
      )}

      {changePwOpen && <ChangePasswordModal onClose={() => setChangePwOpen(false)} />}
    </div>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none',
  background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)',
};

export default function TopBar() {
  const [quick, setQuick] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(null);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const { compareSel, setCompareOpen, setImportOpen, filterBarOpen, setFilterBarOpen, hasFilters } = useFleet();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = quick.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    debounceRef.current = setTimeout(() => {
      fetchVehicles({ search: q })
        .then((list) => setSuggestions(list.slice(0, 8)))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [quick]);

  useEffect(() => {
    Promise.all([fetchSmartAlerts(), fetchFleetAlerts(5)])
      .then(([smart, alerts]) => {
        const items = [
          ...smart.slice(0, 5).map((a) => ({ icon: 'warning-diamond', color: '#e5484d', title: a.title, body: `${a.plate_number} — ${a.body}` })),
          ...alerts.document_expiring.slice(0, 5).map((a) => ({ icon: 'file-x', color: '#edbb00', title: 'Giấy tờ sắp/hết hạn', body: `${a.plate_number} — ${a.doc_type}` })),
        ];
        setNotifs(items);
      })
      .catch(() => setNotifs([]));
  }, []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }

  function goToPlate(plate) {
    setSuggestOpen(false);
    setQuick(plate);
    navigate(`/fleet/tra-cuu?plate=${encodeURIComponent(plate)}`);
  }

  function onQuickSubmit(e) {
    e.preventDefault();
    if (quick.trim()) goToPlate(quick.trim());
  }

  function onVoiceSearch() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      flash('Trình duyệt này không hỗ trợ nhận diện giọng nói — hãy thử Chrome hoặc Edge');
      return;
    }
    if (listening) return;
    const recognizer = new SpeechRecognitionCtor();
    recognizer.lang = 'vi-VN';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognizer.onstart = () => setListening(true);
    recognizer.onresult = (e) => {
      const text = e.results[0][0].transcript.trim();
      setQuick(text.toUpperCase().replace(/\s+/g, ''));
    };
    recognizer.onerror = (e) => flash(`Không nhận diện được giọng nói: ${e.error}`);
    recognizer.onend = () => setListening(false);
    recognizer.start();
  }

  function onPlateDetected(plate) {
    setScanOpen(false);
    setQuick(plate);
    flash(`Đã nhận diện: ${plate} — kiểm tra lại và Enter để tra cứu`);
  }

  async function onRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    flash('Đang đồng bộ dữ liệu mới nhất từ Google Sheet...');
    try {
      await syncSheet();
    } catch (e) {
      flash(`Đồng bộ lỗi: ${e.message} — vẫn tải lại dữ liệu hiện có`);
    } finally {
      window.location.reload();
    }
  }

  async function onExport() {
    flash('Đang xuất dữ liệu đội xe...');
    const vehicles = await fetchVehicles();
    exportCsv('danh-sach-xe.csv', vehicles, [
      { label: 'Biển số', value: (v) => v.plate_number },
      { label: 'Hãng', value: (v) => v.brand },
      { label: 'Model', value: (v) => v.vehicle_model },
      { label: 'Tải trọng', value: (v) => v.load_capacity },
      { label: 'Năm SX', value: (v) => v.manufacture_year },
      { label: 'Bộ phận', value: (v) => v.manager_unit },
      { label: 'Trạng thái', value: (v) => v.status },
      { label: 'ODO', value: (v) => v.odo },
    ]);
  }

  return (
    <header
      style={{
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 24px',
        background: '#fff',
        borderBottom: '1px solid var(--color-divider)',
        boxShadow: '0 1px 0 rgba(20,24,38,.03)',
        zIndex: 5,
        flexWrap: 'wrap',
      }}
    >
      <form onSubmit={onQuickSubmit} style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
        <i className="ph-duotone ph-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9aa1ab' }} />
        <input
          className="input"
          placeholder="Nhập biển số xe..."
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onFocus={() => setSuggestOpen(true)}
          onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
          style={{ paddingLeft: 34, paddingRight: 66, borderRadius: 20, background: '#f5f6f8' }}
        />
        <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          <button type="button" title="Quét biển số bằng camera" onClick={() => setScanOpen(true)} style={iconBtnStyle}>
            <i className="ph-duotone ph-camera" style={{ fontSize: 15 }} />
          </button>
          <button
            type="button"
            title="Tìm bằng giọng nói"
            onClick={onVoiceSearch}
            style={{ ...iconBtnStyle, color: listening ? '#e5484d' : iconBtnStyle.color }}
          >
            <i className="ph-duotone ph-microphone" style={{ fontSize: 15, animation: listening ? 'flt-pulse .9s ease-in-out infinite' : undefined }} />
          </button>
        </div>

        {suggestOpen && quick.trim().length >= 2 && suggestions.length > 0 && (
          <div
            className="flt-page"
            style={{
              position: 'absolute', top: 42, left: 0, right: 0, background: '#fff', border: '1px solid var(--color-divider)',
              borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 55, overflow: 'hidden', maxHeight: 280, overflowY: 'auto',
            }}
          >
            {suggestions.map((v) => (
              <button
                key={v.plate_number}
                type="button"
                onClick={() => goToPlate(v.plate_number)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '9px 14px', border: 'none',
                  background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f5f6f8',
                }}
              >
                <i className="ph-duotone ph-truck" style={{ fontSize: 15, color: '#9aa1ab', flex: 'none' }} />
                <span style={{ font: '600 12.5px var(--font-heading)', flex: 'none' }}>{v.plate_number}</span>
                <span style={{ fontSize: 11.5, color: '#9aa1ab', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.brand} {v.vehicle_model} · {v.manager_unit}
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {scanOpen && <PlateScanModal onClose={() => setScanOpen(false)} onDetected={onPlateDetected} />}

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={() => setFilterBarOpen((o) => !o)}
        title={filterBarOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        style={{
          ...squareBtnStyle,
          position: 'relative',
          background: filterBarOpen ? '#eef4ff' : '#fff',
          borderColor: filterBarOpen ? '#3b6df0' : 'var(--color-divider)',
          color: filterBarOpen ? '#3b6df0' : '#4a5160',
        }}
      >
        <i className="ph-bold ph-funnel" style={{ fontSize: 17 }} />
        {hasFilters && (
          <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: '#e5484d', border: '2px solid #fff' }} />
        )}
      </button>

      <div style={{ position: 'relative' }}>
        <button type="button" onClick={() => setNotifOpen((o) => !o)} title="Thông báo" style={{ ...squareBtnStyle, position: 'relative' }}>
          <i className="ph-duotone ph-bell" style={{ fontSize: 17 }} />
          {notifs && notifs.length > 0 && (
            <span
              style={{
                position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 9,
                background: '#e5484d', color: '#fff', font: '700 10px/16px var(--font-heading)', textAlign: 'center',
              }}
            >
              {notifs.length}
            </span>
          )}
        </button>
        {notifOpen && (
          <div
            className="flt-page"
            style={{
              position: 'absolute', top: 44, right: 0, width: 320, background: '#fff', border: '1px solid var(--color-divider)',
              borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 55, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f1f4', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ font: '600 13px var(--font-heading)' }}>Thông báo</span>
              <span style={{ fontSize: 11, color: '#9aa1ab' }}>{notifs ? notifs.length : 0} khẩn cấp</span>
            </div>
            <div className="flt-scroll" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {!notifs || notifs.length === 0 ? (
                <div style={{ padding: 16, fontSize: 12.5, color: '#9aa1ab' }}>Không có thông báo mới.</div>
              ) : (
                notifs.map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f5f6f8' }}>
                    <div style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, background: `${n.color}1f`, display: 'grid', placeItems: 'center' }}>
                      <i className={`ph-duotone ph-${n.icon}`} style={{ fontSize: 14, color: n.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 12px var(--font-heading)' }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: '#7a828e' }}>{n.body}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '9px 16px', textAlign: 'center', borderTop: '1px solid #f0f1f4' }}>
              <Link to="/fleet/ai-analytics" onClick={() => setNotifOpen(false)} style={{ fontSize: 12 }}>
                Xem tất cả trong AI &amp; Analytics →
              </Link>
            </div>
          </div>
        )}
      </div>

      <SyncIndicator onClick={() => setImportOpen(true)} />

      <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={refreshing}>
        <i className="ph-duotone ph-arrows-clockwise" style={refreshing ? { animation: 'flt-spin .8s linear infinite' } : undefined} />
        {refreshing ? 'Đang đồng bộ...' : 'Làm mới'}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(true)}>
        <i className="ph-duotone ph-upload-simple" />
        Cập nhật dữ liệu
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => setCompareOpen(true)}>
        <i className="ph-duotone ph-scales" />
        So sánh xe ({compareSel.length})
      </button>
      <button type="button" className="btn btn-primary" onClick={onExport}>
        <i className="ph-duotone ph-download-simple" />
        Xuất dữ liệu
      </button>
      <UserMenu />

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#14161a', color: '#fff',
            padding: '10px 20px', borderRadius: 8, font: '600 13px var(--font-heading)', boxShadow: 'var(--shadow-lg)', zIndex: 70,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <i className="ph-duotone ph-check-circle" style={{ fontSize: 16, color: '#4ade80' }} />
          {toast}
        </div>
      )}
    </header>
  );
}

const iconBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: '50%', cursor: 'pointer',
  display: 'grid', placeItems: 'center', color: '#6b7385',
};

const squareBtnStyle = {
  width: 36, height: 36, border: '1px solid var(--color-divider)', background: '#fff', borderRadius: 9, cursor: 'pointer',
  display: 'grid', placeItems: 'center', color: '#4a5160',
};
