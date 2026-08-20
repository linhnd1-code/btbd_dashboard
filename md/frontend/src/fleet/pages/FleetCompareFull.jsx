import { useEffect, useMemo, useState } from 'react';
import { fetchHealthScores, fetchPerformance, fetchVehicles } from '../api';
import { fmtInt } from '../theme';
import DataTable from '../components/DataTable';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';

function RankTable({ title, rows, valueKey, valueLabel }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <DataTable
        columns={[
          { key: 'rank', label: '#', render: (_, i) => i + 1 },
          { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
          { key: 'manager_unit', label: 'Bộ phận' },
          { key: valueKey, label: valueLabel, align: 'right', render: (r) => fmtInt(r[valueKey]) },
        ]}
        rows={rows}
        emptyMessage="Không có dữ liệu"
      />
    </div>
  );
}

export default function FleetCompareFull() {
  const [health, setHealth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState('');
  const [dept, setDept] = useState('all');
  const [brand, setBrand] = useState('all');

  useEffect(() => {
    fetchHealthScores().then(setHealth).catch((e) => setError(e.message));
    fetchPerformance().then(setPerformance).catch((e) => setError(e.message));
    fetchVehicles().then(setVehicles).catch((e) => setError(e.message));
  }, []);

  const merged = useMemo(() => {
    if (!health || !performance || !vehicles) return [];
    const vehicleByPlate = new Map(vehicles.map((v) => [v.plate_number, v]));
    const downtimeByPlate = new Map(performance.map((p) => [p.plate_number, p.total_downtime_hours]));
    return health.map((h) => {
      const vehicle = vehicleByPlate.get(h.plate_number);
      const odo = vehicle?.odo || 0;
      return {
        ...h,
        brand: h.brand || vehicle?.brand,
        odo,
        cost_per_km: odo > 0 ? Math.round(h.total_cost / odo) : null,
        downtime_hours: downtimeByPlate.get(h.plate_number) || 0,
      };
    });
  }, [health, performance, vehicles]);

  const depts = useMemo(() => [...new Set(merged.map((v) => v.manager_unit).filter(Boolean))].sort(), [merged]);
  const brands = useMemo(() => [...new Set(merged.map((v) => v.brand).filter(Boolean))].sort(), [merged]);

  const pool = useMemo(
    () => merged.filter((v) => (dept === 'all' || v.manager_unit === dept) && (brand === 'all' || v.brand === brand)),
    [merged, dept, brand]
  );

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!health || !performance || !vehicles) return <Loading />;

  const top = (key) => [...pool].sort((a, b) => (b[key] || 0) - (a[key] || 0)).slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1>So sánh đội xe</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>
          Xếp hạng toàn đội theo dữ liệu thật. "Chi phí/km" là tổng chi phí BD-SC chia cho ODO hiện tại (ước tính trọn
          đời xe, không phải chi phí/km theo kỳ). "Giờ nằm xưởng" tính từ cột Tổng giờ trong nhật ký BTBD.
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ width: 180 }}>
          <label>Bộ phận</label>
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">-- Tất cả --</option>
            {depts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ width: 180 }}>
          <label>Hãng xe</label>
          <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="all">-- Tất cả --</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>Nhóm so sánh: {pool.length} xe</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, alignItems: 'start' }}>
        <RankTable title="Top 20 chi phí sửa chữa cao" rows={top('total_cost')} valueKey="total_cost" valueLabel="Chi phí (đ)" />
        <RankTable title="Top 20 sửa chữa nhiều lần" rows={top('repair_count')} valueKey="repair_count" valueLabel="Số lần" />
        <RankTable title="Top 20 chi phí/km cao" rows={top('cost_per_km')} valueKey="cost_per_km" valueLabel="đ/km" />
        <RankTable title="Top 20 giờ nằm xưởng nhiều nhất" rows={top('downtime_hours')} valueKey="downtime_hours" valueLabel="Giờ" />
      </div>
    </div>
  );
}
