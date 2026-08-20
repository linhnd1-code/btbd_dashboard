import { useEffect, useState } from 'react';
import { fetchVehicles, fetchMaintenanceRecords } from '../api';
import { useFleet, weightBucket } from '../FleetContext';

function uniq(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

export default function FilterBar() {
  const { filters, setFilter, clearFilters, hasFilters, filterBarOpen } = useFleet();
  const [opts, setOpts] = useState(null);

  useEffect(() => {
    Promise.all([fetchVehicles(), fetchMaintenanceRecords({ page: 1, pageSize: 200 })]).then(([vehicles, records]) => {
      setOpts({
        dept: uniq(vehicles.map((v) => v.manager_unit)),
        brand: uniq(vehicles.map((v) => v.brand)),
        weight: uniq(vehicles.map((v) => weightBucket(v.load_capacity))),
        status: uniq(vehicles.map((v) => v.status)),
        year: uniq(vehicles.map((v) => v.manufacture_year)),
        gara: uniq(records.items.map((r) => r.garage)),
      });
    });
  }, []);

  if (!filterBarOpen || !opts) return null;

  const select = (key, label, options) => (
    <div className="field" style={{ width: 148 }}>
      <label>{label}</label>
      <select className="input" value={filters[key]} onChange={(e) => setFilter(key, e.target.value)}>
        <option value="all">-- Tất cả --</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      style={{
        flex: 'none', display: 'flex', alignItems: 'flex-end', gap: 11, flexWrap: 'wrap',
        padding: '11px 24px 13px', background: '#fff', borderBottom: '1px solid var(--color-divider)',
      }}
    >
      <div style={{ font: '600 12px var(--font-heading)', color: '#3f4655', paddingBottom: 9, whiteSpace: 'nowrap' }}>Bộ lọc toàn cục:</div>
      {select('dept', 'Bộ phận QL', opts.dept)}
      {select('brand', 'Hãng xe', opts.brand)}
      {select('weight', 'Tải trọng', opts.weight)}
      {select('status', 'Trạng thái xe', opts.status)}
      {select('year', 'Năm SX', opts.year)}
      {select('gara', 'Gara sửa chữa', opts.gara)}
      <div className="field" style={{ width: 'auto' }}>
        <label>Khoảng thời gian (Ngày vào xưởng)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} style={{ width: 132 }} />
          <span style={{ fontSize: 12, color: '#9aa1ab' }}>đến</span>
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} style={{ width: 132 }} />
        </div>
      </div>
      <div style={{ flex: 1 }} />
      {hasFilters && (
        <button type="button" className="btn btn-ghost" onClick={clearFilters} style={{ color: '#e5484d', marginBottom: 2 }}>
          <i className="ph-duotone ph-x" />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
