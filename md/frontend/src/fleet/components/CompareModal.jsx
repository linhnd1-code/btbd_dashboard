import { useEffect, useState } from 'react';
import { fetchVehicles, fetchCompare } from '../api';
import { fmtInt, vehicleStatusMeta } from '../theme';
import { useFleet } from '../FleetContext';
import Tag from './Tag';
import DataTable from './DataTable';

export default function CompareModal() {
  const { compareOpen, setCompareOpen, compareSel, toggleCompare } = useFleet();
  const [vehicles, setVehicles] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (compareOpen && !vehicles) {
      fetchVehicles().then(setVehicles).catch((e) => setError(e.message));
    }
  }, [compareOpen, vehicles]);

  useEffect(() => {
    if (compareSel.length < 2) {
      setRows(null);
      return;
    }
    fetchCompare(compareSel).then(setRows).catch((e) => setError(e.message));
  }, [compareSel]);

  if (!compareOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={() => setCompareOpen(false)}>
      <div className="dialog" style={{ width: 'min(780px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">So sánh xe</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Chọn 2–3 phương tiện để so sánh song song các chỉ số vận hành.</div>

        {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}
        {!vehicles ? (
          <div style={{ fontSize: 13, color: '#9aa1ab' }}>Đang tải danh sách xe...</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 140, overflowY: 'auto' }}>
            {vehicles.map((v) => {
              const active = compareSel.includes(v.plate_number);
              return (
                <label
                  key={v.plate_number}
                  className="tag"
                  style={{ cursor: 'pointer', background: active ? '#3b6df0' : '#f1f5f9', color: active ? '#fff' : '#334155', padding: '5px 12px' }}
                >
                  <input type="checkbox" style={{ display: 'none' }} checked={active} onChange={() => toggleCompare(v.plate_number)} />
                  {v.plate_number}
                </label>
              );
            })}
          </div>
        )}

        {compareSel.length > 0 && compareSel.length < 2 && <div style={{ fontSize: 12.5, color: '#9aa1ab' }}>Chọn thêm ít nhất 1 xe nữa để so sánh.</div>}

        {rows && (
          <DataTable
            columns={[
              { key: 'plate_number', label: 'Biển số' },
              { key: 'model', label: 'Hãng/Model', render: (r) => `${r.brand || ''} ${r.vehicle_model || ''}`.trim() },
              { key: 'odo', label: 'Odo', align: 'right', render: (r) => fmtInt(r.odo) },
              { key: 'repair_count', label: 'Lượt SC', align: 'right' },
              { key: 'total_cost', label: 'Chi phí', align: 'right', render: (r) => fmtInt(r.total_cost) + ' đ' },
              { key: 'score', label: 'Điểm', align: 'right' },
              {
                key: 'status',
                label: 'TT',
                render: (r) => {
                  const m = vehicleStatusMeta(r.status);
                  return <Tag label={m.label} color={m.color} bg={m.bg} />;
                },
              },
            ]}
            rows={rows}
          />
        )}

        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={() => setCompareOpen(false)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
