import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchVehicleLookup } from '../api';
import { daysLabel, docStatusMeta, fmtDate, fmtInt, fmtVnd, scheduleStatusMeta, vehicleStatusMeta } from '../theme';
import Tag from '../components/Tag';
import DataTable from '../components/DataTable';

export default function PlateLookup() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('plate') || '');
  const [plate, setPlate] = useState(searchParams.get('plate') || '');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plate) return;
    setResult(null);
    setNotFound(false);
    setError('');
    fetchVehicleLookup(plate)
      .then(setResult)
      .catch((e) => {
        if (e.message.includes('Không tìm thấy')) setNotFound(true);
        else setError(e.message);
      });
  }, [plate]);

  function onSubmit(e) {
    e.preventDefault();
    setPlate(input.trim());
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1>Tra cứu biển số</h1>
      <form onSubmit={onSubmit} className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
          <i className="ph-duotone ph-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9aa1ab' }} />
          <input className="input" placeholder="Nhập biển số..." value={input} onChange={(e) => setInput(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <button type="submit" className="btn btn-primary">
          <i className="ph-duotone ph-magnifying-glass" />
          Tra cứu
        </button>
      </form>

      {error && <div style={{ color: '#e5484d' }}>Lỗi: {error}</div>}
      {notFound && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9aa1ab' }}>
          <i className="ph-duotone ph-truck" style={{ fontSize: 40 }} />
          <div style={{ marginTop: 10 }}>Không tìm thấy biển số "{plate}". Thử nhập biển số khác.</div>
        </div>
      )}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>{result.vehicle.plate_number}</h2>
              <Tag {...vehicleStatusMeta(result.vehicle.status)} />
            </div>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: '#7a828e', marginBottom: 14 }}>
              {result.vehicle.brand} {result.vehicle.vehicle_model} · {result.vehicle.load_capacity} · {result.vehicle.manufacture_year}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
              <Row label="Bộ phận" value={result.vehicle.manager_unit} />
              <Row label="Đội xe" value={result.vehicle.fleet_team} />
              <Row label="Số ODO" value={fmtInt(result.vehicle.odo)} />
              {result.maintenance_status && (
                <>
                  <Row label="Km BD tiếp theo" value={fmtInt(result.maintenance_status.next_maintenance_odo)} />
                  <Row label="Km còn lại" value={fmtInt(result.maintenance_status.remaining_odo)} />
                </>
              )}
            </div>
            {result.maintenance_status && (
              <div style={{ marginTop: 10 }}>
                <Tag {...scheduleStatusMeta(result.maintenance_status.schedule_status)} />
              </div>
            )}
            <h4 style={{ margin: '16px 0 8px' }}>Giấy tờ &amp; hạn</h4>
            <DataTable
              columns={[
                { key: 'doc_type', label: 'Loại' },
                { key: 'expiry_raw', label: 'Hạn', render: (d) => fmtDate(d.expiry_raw) },
                {
                  key: 'doc_status',
                  label: 'TT',
                  render: (d) => <Tag {...docStatusMeta(d.doc_status)} />,
                },
              ]}
              rows={result.documents}
              emptyMessage="Chưa có dữ liệu giấy tờ"
            />
          </div>

          <div className="card">
            <h4>Lịch sử bảo dưỡng · sửa chữa gần đây</h4>
            {result.recent_records.length === 0 && <div style={{ fontSize: 13, fontStyle: 'italic', color: '#9aa1ab' }}>Chưa có lịch sử cho phương tiện này.</div>}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {result.recent_records.map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#eef4ff', display: 'grid', placeItems: 'center' }}>
                      <i className="ph-duotone ph-wrench" style={{ fontSize: 15, color: '#3b82f6' }} />
                    </span>
                    <span style={{ flex: 1, width: 2, background: '#eef0f3', margin: '2px 0' }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ font: '600 13.5px var(--font-heading)' }}>{r.work_type} — {r.detail || r.maintenance_category || ''}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e5484d', whiteSpace: 'nowrap' }}>{r.cost != null ? fmtVnd(r.cost) : ''}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9aa1ab' }}>
                      {fmtDate(r.entry_date)} · {r.garage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f1f4' }}>
      <span style={{ color: '#7a828e' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value ?? '-'}</span>
    </div>
  );
}
