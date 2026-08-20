import { useEffect, useState } from 'react';
import { fetchVehicles } from '../api';
import { vehicleStatusMeta } from '../theme';
import KpiCard from '../components/KpiCard';
import Donut from '../components/Donut';
import ProportionBar from '../components/ProportionBar';
import Bars from '../components/Bars';
import Loading from '../components/Loading';

function ageBucket(year) {
  if (!year) return 'Không rõ';
  const age = 2026 - year;
  if (age <= 1) return '≤ 1 năm';
  if (age <= 3) return '2 – 3 năm';
  if (age <= 5) return '4 – 5 năm';
  if (age <= 8) return '6 – 8 năm';
  return '> 8 năm';
}

function groupCount(list, keyFn) {
  const map = {};
  list.forEach((item) => {
    const k = keyFn(item) || 'Không rõ';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export default function FleetOverview() {
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles().then(setVehicles).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!vehicles) return <Loading />;

  const byType = groupCount(vehicles, (v) => v.load_capacity);
  const byBrand = groupCount(vehicles, (v) => v.brand);
  const ageOrder = ['≤ 1 năm', '2 – 3 năm', '4 – 5 năm', '6 – 8 năm', '> 8 năm', 'Không rõ'];
  const ageDist = groupCount(vehicles, (v) => ageBucket(v.manufacture_year)).sort(
    (a, b) => ageOrder.indexOf(a.label) - ageOrder.indexOf(b.label)
  );

  const statusCounts = groupCount(vehicles, (v) => v.status);
  const statusSegments = statusCounts.map((s) => ({
    label: vehicleStatusMeta(s.label).label,
    value: s.value,
    color: vehicleStatusMeta(s.label).color,
  }));
  const activeCount = vehicles.filter((v) => v.status === 'Hoạt động').length;
  const activePct = vehicles.length ? Math.round((activeCount / vehicles.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1>Tổng quan đội xe</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, alignItems: 'start' }}>
        <KpiCard label="Tổng số xe" value={vehicles.length} unit="xe" icon="truck" iconBg="#eef4ff" iconColor="#3b82f6" />
        <KpiCard label="Số hãng xe" value={byBrand.length} unit="hãng" icon="tag" iconBg="#fff1f4" iconColor="#d6006c" />
        <KpiCard label="Nhóm tải trọng" value={byType.length} unit="nhóm" icon="stack" iconBg="#f1f5f9" iconColor="#5b636f" />
        <KpiCard
          label="Đang hoạt động"
          value={`${activePct}%`}
          sub={`${activeCount}/${vehicles.length} xe`}
          icon="check-circle"
          iconBg={activePct >= 80 ? '#dcfce7' : '#fef3c7'}
          iconColor={activePct >= 80 ? '#16a34a' : '#8a6d00'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <h4>Cơ cấu theo loại xe (tải trọng)</h4>
          <ProportionBar items={byType} color="#3b82f6" valueLabel={(v) => `${v} xe`} />
        </div>
        <div>
          <h4>Cơ cấu theo hãng</h4>
          <ProportionBar items={byBrand} color="#d6006c" valueLabel={(v) => `${v} xe`} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <h4>Phân bố tuổi phương tiện</h4>
          <Bars data={ageDist} color="#3b82f6" unit="xe" />
        </div>
        <div>
          <h4>Trạng thái vận hành</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <Donut segments={statusSegments} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {statusSegments.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 11, height: 11, flex: 'none', borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{s.label}</span>
                  <span style={{ font: '600 14px var(--font-heading)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
