import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVehicleLookup, fetchHealthScores, fetchVehicles } from '../api';
import { docStatusMeta, fmtDate, fmtInt, fmtVnd, healthBand, scheduleStatusMeta, vehicleStatusMeta } from '../theme';
import Tag from '../components/Tag';
import Gauge from '../components/Gauge';
import DataTable from '../components/DataTable';

export default function VehicleDetail() {
  const { plate } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState(null);
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles().then(setVehicles).catch((e) => setError(e.message));
    fetchHealthScores().then(setHealth).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!plate) return;
    setResult(null);
    fetchVehicleLookup(plate).then(setResult).catch((e) => setError(e.message));
  }, [plate]);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;

  const myHealth = health?.find((h) => h.plate_number === plate);
  const band = myHealth ? healthBand(myHealth.score) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: '#7a828e' }}>Chọn phương tiện</span>
        <select className="input" style={{ maxWidth: 260 }} value={plate || ''} onChange={(e) => navigate(`/fleet/xe/${e.target.value}`)}>
          <option value="" disabled>
            -- chọn biển số --
          </option>
          {(vehicles || []).map((v) => (
            <option key={v.plate_number} value={v.plate_number}>
              {v.plate_number} — {v.brand} {v.vehicle_model}
            </option>
          ))}
        </select>
      </div>

      {!result ? (
        <div>{plate ? 'Đang tải...' : 'Chọn 1 xe để xem hồ sơ chi tiết.'}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#e4e7ec',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: '#aab2bd',
                }}
              >
                <i className="ph-duotone ph-truck" style={{ fontSize: 52 }} />
                <span style={{ fontSize: 12 }}>Chưa có ảnh xe trong dữ liệu</span>
              </div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <h2 style={{ margin: 0 }}>{result.vehicle.plate_number}</h2>
                <Tag {...vehicleStatusMeta(result.vehicle.status)} />
              </div>
              <div style={{ fontSize: 13, fontStyle: 'italic', color: '#7a828e', marginBottom: 12 }}>
                {result.vehicle.brand} {result.vehicle.vehicle_model} · {result.vehicle.load_capacity} · {result.vehicle.manufacture_year}
              </div>
              {[
                ['Bộ phận', result.vehicle.manager_unit],
                ['Đội xe', result.vehicle.fleet_team],
                ['Số ODO', fmtInt(result.vehicle.odo)],
                ['Số khung', result.vehicle.chassis_number],
                ['Số máy', result.vehicle.engine_number],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f1f4', fontSize: 13 }}>
                  <span style={{ color: '#7a828e' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'stretch' }}>
              <div className="card">
                <h4>Chỉ số vận hành</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                  {result.maintenance_status && (
                    <>
                      <Metric label="Km BD tiếp theo" value={fmtInt(result.maintenance_status.next_maintenance_odo)} unit="km" />
                      <Metric label="Km còn lại" value={fmtInt(result.maintenance_status.remaining_odo)} unit="km" />
                    </>
                  )}
                  <Metric label="Số lượt BD-SC" value={myHealth ? fmtInt(myHealth.repair_count) : '-'} />
                  <Metric label="Tổng chi phí" value={myHealth ? fmtVnd(myHealth.total_cost) : '-'} />
                </div>
                {result.maintenance_status && (
                  <div style={{ marginTop: 10 }}>
                    <Tag {...scheduleStatusMeta(result.maintenance_status.schedule_status)} />
                  </div>
                )}
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 2px', fontSize: 14 }}>Điểm sức khỏe</h4>
                {myHealth ? (
                  <>
                    <Gauge score={myHealth.score} size={130} />
                    <Tag {...band} />
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#9aa1ab', marginTop: 20 }}>Chưa đủ dữ liệu</div>
                )}
              </div>
            </div>

            <div className="card">
              <h4>Giấy tờ &amp; hạn</h4>
              <DataTable
                columns={[
                  { key: 'doc_type', label: 'Loại' },
                  { key: 'expiry_raw', label: 'Hạn', render: (d) => fmtDate(d.expiry_raw) },
                  { key: 'doc_status', label: 'TT', render: (d) => <Tag {...docStatusMeta(d.doc_status)} /> },
                ]}
                rows={result.documents}
                emptyMessage="Chưa có dữ liệu giấy tờ"
              />
            </div>

            <div className="card">
              <h4>Timeline bảo dưỡng · sửa chữa</h4>
              {result.recent_records.length === 0 && <div style={{ fontSize: 13, fontStyle: 'italic', color: '#9aa1ab' }}>Chưa có lịch sử.</div>}
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
                        <span style={{ font: '600 13.5px var(--font-heading)' }}>
                          {r.work_type} — {r.detail || r.maintenance_category || ''}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#e5484d', whiteSpace: 'nowrap' }}>
                          {r.cost != null ? fmtVnd(r.cost) : ''}
                        </span>
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
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ font: '400 10px/1.3 var(--font-heading)', letterSpacing: '.05em', textTransform: 'uppercase', color: '#7a828e' }}>{label}</div>
      <div style={{ font: '700 22px/1 var(--font-heading)' }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: '#9aa1ab', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}
