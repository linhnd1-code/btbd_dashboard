import { useEffect, useMemo, useState } from 'react';
import { fetchVehicles } from '../api';
import { fmtInt, vehicleStatusMeta } from '../theme';
import DataTable from '../components/DataTable';
import Tag from '../components/Tag';
import PlateLink from '../components/PlateLink';
import Loading from '../components/Loading';
import { useFleet } from '../FleetContext';

export default function VehicleList() {
  const { applyVehicleFilters, hasFilters } = useFleet();
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVehicles().then(setVehicles).catch((e) => setError(e.message));
  }, []);

  const statuses = useMemo(() => {
    if (!vehicles) return [];
    return [...new Set(vehicles.map((v) => v.status).filter(Boolean))];
  }, [vehicles]);

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    return applyVehicleFilters(vehicles).filter(
      (v) =>
        (statusFilter === 'all' || v.status === statusFilter) &&
        (!search || v.plate_number.toLowerCase().includes(search.toLowerCase()))
    );
  }, [vehicles, statusFilter, search, applyVehicleFilters]);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!vehicles) return <Loading />;

  return (
    <div>
      <h1>Danh sách xe</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '16px 0' }}>
        <div className="seg">
          <label className={`seg-opt ${statusFilter === 'all' ? 'active' : ''}`}>
            <input type="radio" name="vf" checked={statusFilter === 'all'} onChange={() => setStatusFilter('all')} />
            <span>Tất cả</span>
          </label>
          {statuses.map((s) => (
            <label key={s} className={`seg-opt ${statusFilter === s ? 'active' : ''}`}>
              <input type="radio" name="vf" checked={statusFilter === s} onChange={() => setStatusFilter(s)} />
              <span>{vehicleStatusMeta(s).label}</span>
            </label>
          ))}
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
          <input className="input" placeholder="Tìm biển số..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#8b929c', marginBottom: 10 }}>
        Hiển thị {filtered.length} phương tiện{hasFilters ? ' (đang áp dụng bộ lọc toàn cục)' : ''}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable
          columns={[
            { key: 'plate_number', label: 'Biển số', render: (v) => <PlateLink plate={v.plate_number} /> },
            { key: 'brandModel', label: 'Hãng / Model', render: (v) => `${v.brand || ''} ${v.vehicle_model || ''}`.trim() || '-' },
            { key: 'load_capacity', label: 'Tải trọng' },
            { key: 'manufacture_year', label: 'Năm SX' },
            { key: 'odo', label: 'Odo (km)', align: 'right', render: (v) => fmtInt(v.odo) },
            { key: 'manager_unit', label: 'Bộ phận' },
            {
              key: 'status',
              label: 'Trạng thái',
              render: (v) => {
                const meta = vehicleStatusMeta(v.status);
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
