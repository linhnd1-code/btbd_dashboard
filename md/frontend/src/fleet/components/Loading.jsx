export default function Loading({ label = 'Đang tải dữ liệu...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0', color: '#8b929c', fontSize: 13 }}>
      <i className="ph-bold ph-spinner-gap" style={{ fontSize: 18, animation: 'flt-spin 0.8s linear infinite' }} />
      {label}
      <style>{'@keyframes flt-spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
