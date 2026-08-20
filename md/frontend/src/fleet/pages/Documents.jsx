import { useEffect, useMemo, useState } from 'react';
import { fetchDocuments, fetchSettings } from '../api';
import { daysLabel, docStatusMeta, fmtDate } from '../theme';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';

const DOC_TYPES = ['Hạn đăng kiểm', 'Hạn phí đường bộ', 'Hạn giấy đăng ký', 'Hạn BH dân sự', 'Hạn BH vật chất', 'Hạn phù hiệu'];

export default function Documents() {
  const [docs, setDocs] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [docType, setDocType] = useState('all');

  useEffect(() => {
    fetchDocuments().then(setDocs).catch((e) => setError(e.message));
    fetchSettings().then(setSettings).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!docs) return [];
    return docType === 'all' ? docs : docs.filter((d) => d.doc_type === docType);
  }, [docs, docType]);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!docs || !settings) return <Loading />;

  const expiredCount = docs.filter((d) => d.doc_status === 'expired').length;
  const soonCount = docs.filter((d) => d.doc_status === 'soon').length;

  return (
    <div>
      <h1>Hồ sơ giấy tờ</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, margin: '16px 0 24px', alignItems: 'start' }}>
        <KpiCard label="Tổng mục giấy tờ theo dõi" value={docs.length} unit="giấy tờ" icon="files" iconBg="#eef4ff" iconColor="#3b82f6" />
        <KpiCard label={`Sắp hết hạn (${settings.expiry_alert_window_days} ngày)`} value={soonCount} unit="giấy tờ" icon="clock-countdown" iconColor="#8a6d00" iconBg="#fef3c7" />
        <KpiCard label="Đã hết hạn" value={expiredCount} unit="giấy tờ" icon="x-circle" iconColor="#e5484d" iconBg="#fee2e2" />
      </div>

      <div className="seg" style={{ marginBottom: 16 }}>
        <label className={`seg-opt ${docType === 'all' ? 'active' : ''}`}>
          <input type="radio" name="dt" checked={docType === 'all'} onChange={() => setDocType('all')} />
          <span>Tất cả</span>
        </label>
        {DOC_TYPES.map((t) => (
          <label key={t} className={`seg-opt ${docType === t ? 'active' : ''}`}>
            <input type="radio" name="dt" checked={docType === t} onChange={() => setDocType(t)} />
            <span>{t}</span>
          </label>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable
          columns={[
            { key: 'plate_number', label: 'Biển số', render: (d) => <PlateLink plate={d.plate_number} /> },
            { key: 'doc_type', label: 'Loại giấy tờ' },
            { key: 'expiry_raw', label: 'Ngày hết hạn', render: (d) => fmtDate(d.expiry_raw) },
            { key: 'days_remaining', label: 'Còn lại', render: (d) => daysLabel(d.days_remaining) },
            {
              key: 'doc_status',
              label: 'Trạng thái',
              render: (d) => {
                const meta = docStatusMeta(d.doc_status);
                return <Tag label={meta.label} color={meta.color} bg={meta.bg} />;
              },
            },
          ]}
          rows={filtered}
        />
      </div>
    </div>
  );
}
