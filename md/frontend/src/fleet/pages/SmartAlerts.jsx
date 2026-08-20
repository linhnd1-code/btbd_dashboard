import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSmartAlerts } from '../api';
import Loading from '../components/Loading';

const SEVERITY_META = {
  critical: { color: '#e5484d', icon: 'warning-diamond', label: 'Nghiêm trọng' },
  warning: { color: '#edbb00', icon: 'warning-circle', label: 'Cần chú ý' },
};

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSmartAlerts().then(setAlerts).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!alerts) return <Loading />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1>AI &amp; Analytics</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>
          <strong>Minh bạch:</strong> đây là phân tích tổng hợp theo quy tắc (rule-based) trên dữ liệu thật — chi phí
          cao bất thường, sửa chữa lặp lại, quá hạn bảo dưỡng nặng, nhiều giấy tờ hết hạn.{' '}
          <strong>Không phải mô hình AI/machine learning</strong> — mockup gốc gọi là "Dự báo AI" nhưng không có dữ
          liệu huấn luyện nào để làm điều đó thật, nên đặt tên đúng bản chất để không gây hiểu nhầm.
        </div>
      </div>

      {alerts.length === 0 && <div className="card">Không có cảnh báo nào hiện tại.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map((a, i) => {
          const meta = SEVERITY_META[a.severity] || SEVERITY_META.warning;
          return (
            <div
              key={i}
              className="card"
              style={{ display: 'flex', gap: 11, borderLeft: `3px solid ${meta.color}`, padding: '14px 16px' }}
            >
              <i className={`ph-duotone ph-${meta.icon}`} style={{ fontSize: 20, color: meta.color, flex: 'none', marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link to={`/fleet/xe/${a.plate_number}`} className="plate-link" style={{ font: '600 13.5px var(--font-heading)' }}>
                    {a.plate_number}
                  </Link>
                  <span className="tag" style={{ background: `${meta.color}22`, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, marginTop: 2 }}>{a.title}</div>
                <div style={{ fontSize: 12.5, color: '#5b636f', marginTop: 2 }}>{a.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
