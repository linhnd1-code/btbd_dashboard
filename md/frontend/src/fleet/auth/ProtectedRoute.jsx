import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Bọc quanh route cần đăng nhập. `roles` (optional) giới hạn thêm theo vai trò —
 * nếu không truyền, chỉ cần đăng nhập (bất kỳ role nào) là xem được.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null; // đợi xác thực token với server xong, tránh nháy redirect sai
  if (!user) return <Navigate to="/fleet/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="fleet-shell" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Không có quyền truy cập</h2>
        <p className="text-muted">Tài khoản của bạn ({user.role}) không được phép xem trang này.</p>
      </div>
    );
  }
  return children;
}
