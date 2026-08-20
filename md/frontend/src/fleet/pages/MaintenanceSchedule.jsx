import { useEffect, useMemo, useState } from 'react';
import { fetchMaintenanceSchedule } from '../api';
import Loading from '../components/Loading';
import { fmtInt, scheduleStatusMeta } from '../theme';
import Tag from '../components/Tag';
import PlateLink from '../components/PlateLink';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'due', label: 'Đến kỳ' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'ok', label: 'Còn xa' },
];

export default function MaintenanceSchedule({ embedded = false }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMaintenanceSchedule().then(setRows).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return filter === 'all' ? rows : rows.filter((r) => r.schedule_status === filter);
  }, [rows, filter]);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!rows) return <Loading />;

  return (
    <div style={{ padding: embedded ? '14px 16px 4px' : 0 }}>
      {!embedded && (
        <>
          <h1>Theo dõi bảo dưỡng</h1>
          <div style={{ fontSize: 13, color: '#7a828e', margin: '4px 0 16px' }}>Sắp xếp theo mức độ ưu tiên · mốc bảo dưỡng theo km</div>
        </>
      )}
      <div className="seg" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <label key={f.key} className={`seg-opt ${filter === f.key ? 'active' : ''}`}>
            <input type="radio" name="ms" checked={filter === f.key} onChange={() => setFilter(f.key)} />
            <span>{f.label}</span>
          </label>
        ))}
      </div>

      <div className="card" style={{ padding: 4 }}>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9aa1ab' }}>Không có xe nào</div>}
        {filtered.map((r) => {
          const meta = scheduleStatusMeta(r.schedule_status);
          return (
            <div
              key={r.plate_number}
              style={{
                display: 'grid',
                gridTemplateColumns: '14px 1fr auto auto',
                gap: 20,
                alignItems: 'center',
                padding: '14px 10px',
                borderBottom: '1px solid #f0f1f4',
              }}
            >
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: meta.color }} />
              <div>
                <div style={{ font: '600 14px var(--font-heading)' }}>
                  <PlateLink plate={r.plate_number} /> · {r.brand}
                </div>
                <div style={{ fontSize: 12, color: '#9aa1ab' }}>
                  Odo hiện tại {fmtInt(r.current_odo)} → mốc {fmtInt(r.next_maintenance_odo)} km
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9aa1ab' }}>Còn lại</div>
                <div style={{ font: '600 14px var(--font-heading)' }}>{fmtInt(r.remaining_odo)} km</div>
              </div>
              <Tag label={meta.label} color={meta.color} bg={meta.bg} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
