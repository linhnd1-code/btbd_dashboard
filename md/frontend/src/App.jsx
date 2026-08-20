import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import { AuthProvider } from './fleet/auth/AuthContext'
import ProtectedRoute from './fleet/auth/ProtectedRoute'
import LoginPage from './fleet/auth/LoginPage'
import RegisterPage from './fleet/auth/RegisterPage'
import FleetLayout from './fleet/FleetLayout'
import Overview from './fleet/pages/Overview'
import FleetOverview from './fleet/pages/FleetOverview'
import VehicleList from './fleet/pages/VehicleList'
import Documents from './fleet/pages/Documents'
import RegistrationPlan from './fleet/pages/RegistrationPlan'
import MaintenanceOverview from './fleet/pages/MaintenanceOverview'
import MaintenanceTrack from './fleet/pages/MaintenanceTrack'
import RepairTrack from './fleet/pages/RepairTrack'
import FleetCompareFull from './fleet/pages/FleetCompareFull'
import PlateLookup from './fleet/pages/PlateLookup'
import VehicleDetail from './fleet/pages/VehicleDetail'
import HealthScore from './fleet/pages/HealthScore'
import ReportsPage from './fleet/pages/Reports'
import SmartAlerts from './fleet/pages/SmartAlerts'
import Roadside from './fleet/pages/Roadside'
import MaintenanceTicket from './fleet/pages/MaintenanceTicket'
import FleetSettings from './fleet/pages/Settings'
import Performance from './fleet/pages/Performance'

function FrameworkLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ padding: '15px 30px', background: '#1e293b', display: 'flex', gap: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🏠 Khung Sườn Tổng (Dashboard)</Link>
        <Link to="/fleet" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 'bold' }}>🚚 Bảo trì đội xe</Link>
        <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 'bold' }}>🎬 Module Render Video</a>
        <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 'bold' }}>👥 Module Quản lý Nội bộ</a>
      </nav>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<FrameworkLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* Login/Đăng ký nằm NGOÀI FleetLayout — không có sidebar/topbar, và chính là nơi
              duy nhất trong module Fleet không yêu cầu đã đăng nhập. */}
          <Route path="/fleet/login" element={<LoginPage />} />
          <Route path="/fleet/register" element={<RegisterPage />} />

          <Route
            path="/fleet"
            element={
              <ProtectedRoute>
                <FleetLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="doi-xe" element={<FleetOverview />} />
            <Route path="danh-sach-xe" element={<VehicleList />} />
            <Route path="giay-to" element={<Documents />} />
            <Route path="dang-kiem" element={<RegistrationPlan />} />
            <Route path="bdsc" element={<MaintenanceOverview />} />
            <Route path="theo-doi-bao-duong" element={<MaintenanceTrack />} />
            <Route path="theo-doi-sua-chua" element={<RepairTrack />} />
            {/* Chỉ Admin/Quản lý được lập phiếu bảo dưỡng mới — Viewer chỉ xem, không sửa dữ liệu. */}
            <Route
              path="phieu-bao-duong"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <MaintenanceTicket />
                </ProtectedRoute>
              }
            />
            <Route path="doc-duong" element={<Roadside />} />
            <Route path="hieu-suat" element={<Performance />} />
            <Route path="diem-suc-khoe" element={<HealthScore />} />
            <Route path="xe" element={<VehicleDetail />} />
            <Route path="xe/:plate" element={<VehicleDetail />} />
            <Route path="so-sanh-doi-xe" element={<FleetCompareFull />} />
            <Route path="tra-cuu" element={<PlateLookup />} />
            <Route path="bao-cao" element={<ReportsPage />} />
            <Route path="ai-analytics" element={<SmartAlerts />} />
            <Route path="cai-dat" element={<FleetSettings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
