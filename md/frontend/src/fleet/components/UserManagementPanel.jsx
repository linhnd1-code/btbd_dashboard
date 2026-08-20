import { useEffect, useState } from 'react';
import { listUsers, updateUser } from '../authApi';
import { useAuth } from '../auth/AuthContext';
import DataTable from './DataTable';
import Loading from './Loading';
import Tag from './Tag';

const ROLE_LABEL = { admin: 'Quản trị viên', manager: 'Quản lý', viewer: 'Người xem' };
const STATUS_TAG = {
  pending: { label: 'Chờ duyệt', color: '#946200', bg: '#fff3d6' },
  active: { label: 'Đang hoạt động', color: '#0d6b3a', bg: '#e3f8ec' },
  rejected: { label: 'Đã từ chối', color: '#a1132c', bg: '#fde8ec' },
};

export default function UserManagementPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load() {
    listUsers().then(setUsers).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function act(userId, patch) {
    setBusyId(userId);
    setError('');
    try {
      const updated = await updateUser(userId, patch);
      setUsers((list) => list.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (error && !users) return <div style={{ color: '#e5484d' }}>Lỗi tải danh sách tài khoản: {error}</div>;
  if (!users) return <Loading />;

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 4 }}>Quản lý người dùng</h2>
      <div className="text-muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
        {pendingCount > 0
          ? `${pendingCount} tài khoản đang chờ phê duyệt.`
          : 'Không có tài khoản nào đang chờ phê duyệt.'}{' '}
        Chỉ tài khoản email @ghn.vn mới tự đăng ký được.
      </div>

      {error && <div style={{ color: '#e5484d', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <DataTable
        emptyMessage="Chưa có tài khoản nào"
        rows={users}
        columns={[
          {
            key: 'full_name',
            label: 'Họ tên / Email',
            render: (u) => (
              <div>
                <div style={{ fontWeight: 600 }}>{u.full_name || '(chưa đặt tên)'}</div>
                <div style={{ fontSize: 11, color: '#9aa1ab' }}>{u.email}</div>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (u) => {
              const t = STATUS_TAG[u.status] || STATUS_TAG.pending;
              return <Tag label={t.label} color={t.color} bg={t.bg} />;
            },
          },
          {
            key: 'role',
            label: 'Vai trò',
            render: (u) =>
              u.id === me.id ? (
                // Không cho Admin tự đổi role của chính mình từ UI này (khớp rule Backend chặn tự hạ quyền
                // bản thân) — hiển thị dạng nhãn tĩnh thay vì dropdown để tránh gây hiểu nhầm là đổi được.
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{ROLE_LABEL[u.role]} (bạn)</span>
              ) : (
                <select
                  className="input"
                  style={{ padding: '5px 8px', fontSize: 12.5, height: 'auto' }}
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => act(u.id, { role: e.target.value })}
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="manager">Quản lý</option>
                  <option value="viewer">Người xem</option>
                </select>
              ),
          },
          {
            key: 'actions',
            label: 'Thao tác',
            render: (u) => {
              if (u.id === me.id) return null;
              if (u.status === 'pending') {
                return (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-primary" disabled={busyId === u.id} onClick={() => act(u.id, { status: 'active' })} style={btnSm}>
                      Duyệt
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={busyId === u.id} onClick={() => act(u.id, { status: 'rejected' })} style={btnSm}>
                      Từ chối
                    </button>
                  </div>
                );
              }
              if (u.status === 'active') {
                return (
                  <button type="button" className="btn btn-secondary" disabled={busyId === u.id} onClick={() => act(u.id, { status: 'rejected' })} style={btnSm}>
                    Khoá tài khoản
                  </button>
                );
              }
              return (
                <button type="button" className="btn btn-secondary" disabled={busyId === u.id} onClick={() => act(u.id, { status: 'active' })} style={btnSm}>
                  Mở khoá
                </button>
              );
            },
          },
        ]}
      />
    </div>
  );
}

const btnSm = { padding: '5px 12px', fontSize: 12 };
