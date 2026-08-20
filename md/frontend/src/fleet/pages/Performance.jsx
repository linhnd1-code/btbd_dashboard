import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPerformance } from '../api';
import { fmtInt } from '../theme';
import DataTable from '../components/DataTable';
import KpiCard from '../components/KpiCard';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';

export default function Performance() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance().then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!rows) return <Loading />;

  const totalDowntime = rows.reduce((s, r) => s + r.total_downtime_hours, 0);
  const totalVisits = rows.reduce((s, r) => s + r.visit_count, 0);
  const worst = rows.slice(0, 15);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1>Hiệu suất đội xe</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>
          Sheet nguồn không có dữ liệu tiêu hao nhiên liệu (L/100km) hay uptime% nên không hiển thị 2 chỉ số đó ở đây
          (không dùng số bịa). Chỉ số hiệu suất duy nhất có thể tính thật là <strong>thời gian nằm xưởng</strong> (cột
          "Tổng giờ" trong nhật ký BTBD) — xe nằm xưởng nhiều = hiệu suất vận hành thấp.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, alignItems: 'start' }}>
        <KpiCard label="Tổng số lượt BTBD" value={fmtInt(totalVisits)} icon="wrench" iconBg="#fef3c7" iconColor="#b98a00" />
        <KpiCard label="Tổng giờ nằm xưởng" value={fmtInt(Math.round(totalDowntime))} unit="giờ" icon="clock" iconBg="#fee2e2" iconColor="#e5484d" />
        <KpiCard
          label="TB giờ nằm xưởng / lượt"
          value={totalVisits ? (totalDowntime / totalVisits).toFixed(1) : '-'}
          unit="giờ"
          icon="chart-line-up"
          iconBg="#eef4ff"
          iconColor="#3b82f6"
        />
      </div>

      <div className="card">
        <h4>Top 15 xe nằm xưởng nhiều nhất (cần chú ý)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {worst.map((r) => {
            const max = worst[0].total_downtime_hours || 1;
            return (
              <div key={r.plate_number} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to={`/fleet/xe/${r.plate_number}`} className="plate-link" style={{ width: 90, flex: 'none', fontSize: 12, fontFamily: 'var(--font-heading)' }}>
                  {r.plate_number}
                </Link>
                <div style={{ flex: 1, height: 12, background: '#eef0f3', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(r.total_downtime_hours / max) * 100}%`, background: '#e5484d' }} />
                </div>
                <span style={{ width: 70, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{r.total_downtime_hours} giờ</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px 0' }}>
          <h4>Toàn bộ đội xe</h4>
        </div>
        <DataTable
          columns={[
            { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
            { key: 'manager_unit', label: 'Bộ phận', render: (r) => r.manager_unit || '-' },
            { key: 'visit_count', label: 'Số lượt BTBD', align: 'right' },
            { key: 'total_downtime_hours', label: 'Tổng giờ nằm xưởng', align: 'right' },
            { key: 'avg_hours_per_visit', label: 'TB giờ / lượt', align: 'right', render: (r) => r.avg_hours_per_visit ?? '-' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}
