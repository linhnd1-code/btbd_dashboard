import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import '../styles/fleet-theme.css';
import { FleetProvider } from './FleetContext';
import { useAuth } from './auth/AuthContext';
import ChangePasswordModal from './auth/ChangePasswordModal';
import TopBar from './components/TopBar';
import FilterBar from './components/FilterBar';
import CompareModal from './components/CompareModal';
import ImportModal from './components/ImportModal';

const NAV = [
  { to: '/fleet', label: 'Tổng quan', icon: 'gauge', end: true },
  {
    label: 'Thông tin xe',
    icon: 'truck',
    children: [
      { to: '/fleet/doi-xe', label: 'Tổng quan đội xe' },
      { to: '/fleet/danh-sach-xe', label: 'Danh sách xe' },
      { to: '/fleet/giay-to', label: 'Hồ sơ giấy tờ' },
      { to: '/fleet/dang-kiem', label: 'Kế hoạch đăng kiểm' },
    ],
  },
  {
    label: 'Bảo dưỡng · Sửa chữa',
    icon: 'wrench',
    children: [
      { to: '/fleet/bdsc', label: 'Tổng quan' },
      { to: '/fleet/theo-doi-bao-duong', label: 'Theo dõi bảo dưỡng' },
      { to: '/fleet/theo-doi-sua-chua', label: 'Theo dõi sửa chữa' },
      // Chỉ Admin/Quản lý mới lập được phiếu — ẩn hẳn khỏi menu của Viewer thay vì để bấm vào
      // rồi mới báo "Không có quyền" (route vẫn chặn ở App.jsx phòng trường hợp gõ thẳng URL).
      { to: '/fleet/phieu-bao-duong', label: 'Phiếu bảo dưỡng', roles: ['admin', 'manager'] },
      { to: '/fleet/doc-duong', label: 'Sửa chữa dọc đường' },
    ],
  },
  { to: '/fleet/hieu-suat', label: 'Hiệu suất đội xe', icon: 'chart-line-up' },
  { to: '/fleet/diem-suc-khoe', label: 'Điểm sức khỏe xe', icon: 'heartbeat' },
  { to: '/fleet/xe', label: 'Hồ sơ chi tiết xe', icon: 'identification-card' },
  { to: '/fleet/so-sanh-doi-xe', label: 'So sánh đội xe', icon: 'scales' },
  { to: '/fleet/bao-cao', label: 'Báo cáo', icon: 'file-text' },
  { to: '/fleet/ai-analytics', label: 'AI & Analytics', icon: 'sparkle' },
  { to: '/fleet/cai-dat', label: 'Cài đặt', icon: 'gear' },
];

// Ẩn hẳn mục nào có `roles` mà role hiện tại không nằm trong đó — group nào rỗng sau khi lọc
// con thì bỏ luôn group để không hiện tiêu đề trơ trọi không có mục con nào bấm được.
function filterNavByRole(nav, role) {
  return nav
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => (item.children ? { ...item, children: item.children.filter((c) => !c.roles || c.roles.includes(role)) } : item))
    .filter((item) => !item.children || item.children.length > 0);
}

function NavButton({ item }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  if (item.children) {
    const groupActive = item.children.some((c) => location.pathname === c.to);
    return (
      <div style={{ marginBottom: 2 }}>
        <button type="button" onClick={() => setOpen((o) => !o)} className="fleet-nav-btn" style={navBtnStyle(false, groupActive)}>
          <i className={`ph-duotone ph-${item.icon}`} style={{ fontSize: 17, flex: 'none', opacity: groupActive ? 1 : 0.85 }} />
          <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
          <i
            className="ph-bold ph-caret-down"
            style={{ fontSize: 11, transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .18s var(--ease)', opacity: 0.6 }}
          />
        </button>
        <div style={{ maxHeight: open ? 999 : 0, overflow: 'hidden', transition: 'max-height .2s var(--ease)' }}>
          {item.children.map((c) => (
            <NavLink key={c.to} to={c.to} className={({ isActive }) => `fleet-nav-btn${isActive ? ' active' : ''}`} style={({ isActive }) => childBtnStyle(isActive)}>
              {({ isActive }) => (
                <>
                  <span style={{ width: 5, height: 5, flex: 'none', borderRadius: '50%', background: isActive ? '#3b6df0' : '#5b6478', transition: 'background .15s var(--ease)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{c.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `fleet-nav-btn${isActive ? ' active' : ''}`} style={({ isActive }) => navBtnStyle(isActive)}>
      <i className={`ph-duotone ph-${item.icon}`} style={{ fontSize: 17, flex: 'none' }} />
      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
    </NavLink>
  );
}

function navBtnStyle(active, groupActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '9px 10px',
    borderRadius: 8,
    border: 'none',
    background: active || groupActive ? 'rgba(59,109,240,.16)' : 'transparent',
    color: active || groupActive ? '#fff' : '#c3c9d6',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: 2,
  };
}

function childBtnStyle(active) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 10px 8px 30px',
    borderRadius: 8,
    color: active ? '#fff' : '#9aa3b8',
    background: active ? 'rgba(59,109,240,.16)' : 'transparent',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    textDecoration: 'none',
    marginBottom: 1,
  };
}

export default function FleetLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('fleet_sidebar_collapsed') === '1');
  const visibleNav = filterNavByRole(NAV, user?.role);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('fleet_sidebar_collapsed', !c ? '1' : '0');
      return !c;
    });
  }

  return (
    <FleetProvider>
      <div className="fleet-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <aside
          style={{
            position: 'relative',
            width: collapsed ? 76 : 244,
            flex: 'none',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(190deg, #141c2e 0%, #0f1524 100%)',
            color: '#e8ecf4',
            boxShadow: '2px 0 12px rgba(0,0,0,.15)',
            transition: 'width .18s var(--ease)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: collapsed ? '18px 0 16px' : '18px 16px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 11,
              borderBottom: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div
              style={{
                width: 37,
                height: 37,
                flex: 'none',
                borderRadius: 10,
                background: 'linear-gradient(135deg,#3b6df0,#8a5cf6)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 10px -2px rgba(59,109,240,.55)',
              }}
            >
              <i className="ph-duotone ph-truck" style={{ fontSize: 19, color: '#fff' }} />
            </div>
            {!collapsed && (
              <div style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                <div style={{ font: '700 15px var(--font-heading)', color: '#fff', letterSpacing: '.01em' }}>FLEET OPS</div>
                <div style={{ fontSize: 11, color: '#8b93a7' }}>Quản lý Đội xe</div>
              </div>
            )}
          </div>

          <button
            type="button"
            title={collapsed ? 'Hiện thanh điều hướng' : 'Ẩn thanh điều hướng'}
            onClick={toggleCollapsed}
            style={{
              position: 'absolute',
              top: 26,
              right: -13,
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid var(--color-divider)',
              background: '#fff',
              color: '#4a5160',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 20,
            }}
          >
            <i className={`ph-bold ph-caret-${collapsed ? 'right' : 'left'}`} style={{ fontSize: 12 }} />
          </button>

          {!collapsed && (
            <nav className="flt-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 10px 20px' }}>
              {visibleNav.map((item) => (
                <NavButton key={item.label} item={item} />
              ))}
            </nav>
          )}
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <TopBar />
          <FilterBar />
          <main className="flt-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 24px 60px' }}>
            <div key={location.pathname} className="flt-page">
              <Outlet />
            </div>
          </main>
        </div>

        <CompareModal />
        <ImportModal />
        {user?.must_change_password && <ChangePasswordModal forced />}
      </div>
    </FleetProvider>
  );
}
