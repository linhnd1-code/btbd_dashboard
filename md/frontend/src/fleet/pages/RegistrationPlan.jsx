import { useEffect, useState } from 'react';
import { fetchDocuments, fetchSettings } from '../api';
import { daysLabel, docStatusMeta, fmtDate } from '../theme';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';

export default function RegistrationPlan() {
  const [docs, setDocs] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments('Hạn đăng kiểm').then(setDocs).catch((e) => setError(e.message));
    fetchSettings().then(setSettings).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!docs || !settings) return <Loading />;

  const windowDays = settings.expiry_alert_window_days;
  // Áp đúng 3 trạng thái chuẩn toàn hệ thống — dùng doc_status backend đã tính
  // theo ngưỡng cấu hình ở Cài đặt, không hard-code số ngày riêng cho trang này.
  const expired = docs.filter((d) => d.doc_status === 'expired');
  const soon = docs.filter((d) => d.doc_status === 'soon');
  const upcoming = docs.filter((d) => d.doc_status === 'ok' && d.days_remaining <= windowDays * 2);

  const cols = [
    { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
    { key: 'manager_unit', label: 'Bộ phận' },
    { key: 'expiry_raw', label: 'Ngày hết hạn', render: (r) => fmtDate(r.expiry_raw) },
    { key: 'days_remaining', label: 'Còn lại', render: (r) => daysLabel(r.days_remaining) },
    { key: 'tag', label: 'Trạng thái', render: (r) => <Tag {...docStatusMeta(r.doc_status)} /> },
  ];

  return (
    <div>
      <h1>Kế hoạch đăng kiểm</h1>
      <div style={{ fontSize: 12.5, color: '#7a828e', margin: '4px 0 16px' }}>
        Ngưỡng "Sắp hết hạn" hiện là <strong>{windowDays} ngày</strong> — chỉnh ở trang Cài đặt.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 15, margin: '0 0 24px', alignItems: 'start' }}>
        <KpiCard label="Đã hết đăng kiểm" value={expired.length} unit="xe" iconColor="#e5484d" icon="warning-diamond" iconBg="#fee2e2" />
        <KpiCard label={`Sắp hết hạn (≤${windowDays} ngày)`} value={soon.length} unit="xe" icon="calendar" iconBg="#fef3c7" iconColor="#8a6d00" />
        <KpiCard label={`Còn hạn (≤${windowDays * 2} ngày tới)`} value={upcoming.length} unit="xe" icon="calendar-check" iconBg="#dcfce7" iconColor="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h4>Xe đã hết đăng kiểm</h4>
          <DataTable columns={cols} rows={expired} emptyMessage="Không có xe quá hạn" />
        </div>
        <div className="card">
          <h4>Xe sắp hết đăng kiểm (≤{windowDays} ngày)</h4>
          <DataTable columns={cols} rows={soon} emptyMessage="Không có xe nào" />
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h4>Xe còn hạn, cần theo dõi trong {windowDays * 2} ngày tới</h4>
        <DataTable columns={cols} rows={upcoming} emptyMessage="Không có xe nào" />
      </div>
    </div>
  );
}
