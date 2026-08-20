import { useEffect, useState } from 'react';
import { fetchMaintenanceTrack } from '../api';
import { fmtInt, fmtMonthLabel, lastMonths } from '../theme';
import Donut from '../components/Donut';
import Bars from '../components/Bars';
import Loading from '../components/Loading';
import DataTable from '../components/DataTable';
import PlateLink from '../components/PlateLink';
import MaintenanceSchedule from './MaintenanceSchedule';

const COMPLIANCE_COLORS = { 'Đúng định mức': '#16a34a', 'Sai định mức': '#e5484d', 'Chưa kiểm tra': '#9aa1ab' };

function DeviationRows({ items }) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <div>
      {items.map((item) => (
        <div key={item.label} style={{ marginBottom: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
            <span>{item.label}</span>
            <span style={{ fontWeight: 600, color: item.value < 0 ? '#e5484d' : '#16a34a' }}>
              {item.value > 0 ? '+' : ''}
              {fmtInt(item.value)} km
            </span>
          </div>
          <div style={{ height: 8, background: '#eef0f3', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                height: '100%',
                width: `${(Math.abs(item.value) / max) * 100}%`,
                left: item.value < 0 ? 0 : undefined,
                right: item.value >= 0 ? 0 : undefined,
                background: item.value < 0 ? '#e5484d' : '#16a34a',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MaintenanceTrack() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMaintenanceTrack().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!data) return <Loading />;

  const donutSegments = data.compliance.map((c) => ({ label: c.label, value: c.value, color: COMPLIANCE_COLORS[c.label] || '#9aa1ab' }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1>Theo dõi bảo dưỡng</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>Toàn bộ số liệu tính trực tiếp từ nhật ký BTBD và trạng thái ODO thật, theo tháng thật (không nội suy).</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h4>Tỷ lệ tuân thủ bảo dưỡng</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut segments={donutSegments} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
              {donutSegments.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, flex: 'none', borderRadius: 3, background: s.color }} />
                  <span style={{ fontSize: 12.5, flex: 1, color: '#5b636f' }}>{s.label}</span>
                  <span style={{ font: '600 13px var(--font-heading)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <h4>
            Xu hướng bảo dưỡng đúng hạn <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(%/tháng, 6 tháng gần nhất)</span>
          </h4>
          <Bars data={lastMonths(data.monthly_trend).map((d) => ({ label: fmtMonthLabel(d.label), value: d.on_time_rate }))} color="#16a34a" unit="%" />
        </div>
        <div className="card">
          <h4>
            Số lượt bảo dưỡng theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
          </h4>
          <Bars data={lastMonths(data.monthly_count).map((d) => ({ label: fmtMonthLabel(d.label), value: d.value }))} color="#3b82f6" unit="lượt" />
        </div>
      </div>

      <div className="card">
        <h4>
          Chi phí bảo dưỡng theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
        </h4>
        <Bars data={lastMonths(data.monthly_cost).map((d) => ({ label: fmtMonthLabel(d.label), value: d.value }))} color="#8a5cf6" unit="đ" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h4>Mức trễ/sớm theo bộ phận (km còn lại TB)</h4>
          <DeviationRows items={data.deviation_by_dept} />
        </div>
        <div className="card">
          <h4>Mức trễ/sớm theo hãng xe (km còn lại TB)</h4>
          <DeviationRows items={data.deviation_by_brand} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h4>Top xe bảo dưỡng trễ hạn nhất</h4>
          <DataTable
            columns={[
              { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
              { key: 'manager_unit', label: 'Bộ phận' },
              { key: 'remaining_odo', label: 'Km còn lại', align: 'right', render: (r) => fmtInt(r.remaining_odo) },
            ]}
            rows={data.top_late}
          />
        </div>
        <div className="card">
          <h4>Top xe còn dư nhiều km nhất (chưa đến hạn)</h4>
          <DataTable
            columns={[
              { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
              { key: 'manager_unit', label: 'Bộ phận' },
              { key: 'remaining_odo', label: 'Km còn lại', align: 'right', render: (r) => fmtInt(r.remaining_odo) },
            ]}
            rows={data.top_early}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px 0' }}>
          <h4>Kế hoạch bảo dưỡng — xe đến lịch &amp; trễ hạn</h4>
        </div>
        <MaintenanceSchedule embedded />
      </div>
    </div>
  );
}
