import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHealthScores } from '../api';
import { fmtInt, healthBand } from '../theme';
import Gauge from '../components/Gauge';
import Tag from '../components/Tag';
import DataTable from '../components/DataTable';
import Loading from '../components/Loading';

export default function HealthScore() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealthScores().then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!rows) return <Loading />;

  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  const avgBand = healthBand(avg);
  const bandCounts = rows.reduce((acc, r) => {
    const b = healthBand(r.score);
    const key = b.label;
    acc[key] = acc[key] || { count: 0, color: b.color };
    acc[key].count += 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1>Điểm sức khỏe xe</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>
          Công thức minh bạch tính từ dữ liệu thật (không phải AI): 40% Tuân thủ bảo dưỡng · 25% Tần suất sửa chữa · 20%
          Tình trạng BD hiện tại · 15% Hồ sơ giấy tờ.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 4px' }}>Điểm sức khỏe trung bình đội</h4>
          <Gauge score={avg} />
          <Tag label={avgBand.label} color={avgBand.color} bg={avgBand.bg} />
        </div>
        <div className="card">
          <h4>Phân bố xếp loại</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px' }}>
            {Object.entries(bandCounts).map(([label, info]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: info.color, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#5b636f' }}>
                  {label} · <strong>{info.count}</strong> xe
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px 0' }}>
          <h4>Bảng điểm sức khỏe toàn đội</h4>
        </div>
        <DataTable
          columns={[
            { key: 'rank', label: '#', render: (_, i) => i + 1 },
            {
              key: 'plate_number',
              label: 'Biển số',
              render: (r) => (
                <Link to={`/fleet/xe/${r.plate_number}`} className="plate-link" style={{ fontWeight: 600 }}>
                  {r.plate_number}
                </Link>
              ),
            },
            { key: 'manager_unit', label: 'Bộ phận' },
            { key: 'compliance_score', label: 'Tuân thủ BD', align: 'right' },
            { key: 'repair_count', label: 'Số lượt SC', align: 'right', render: (r) => fmtInt(r.repair_count) },
            { key: 'total_cost', label: 'Chi phí BD-SC', align: 'right', render: (r) => fmtInt(r.total_cost) + ' đ' },
            { key: 'score', label: 'Điểm', align: 'right' },
            {
              key: 'band',
              label: 'Xếp loại',
              render: (r) => {
                const b = healthBand(r.score);
                return <Tag label={b.label} color={b.color} bg={b.bg} />;
              },
            },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}
