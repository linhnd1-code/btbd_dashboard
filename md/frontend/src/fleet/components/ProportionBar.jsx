export default function ProportionBar({ items, color = '#3b82f6', valueLabel = (v) => `${v}` }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (!items.length || !items.some((i) => i.value > 0)) {
    return (
      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b6bf', fontSize: 13, gap: 8 }}>
        <i className="ph-duotone ph-clock-countdown" style={{ fontSize: 18 }} />
        Đang cập nhật
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.label} style={{ marginBottom: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>{item.label}</span>
            <span style={{ fontWeight: 600 }}>{valueLabel(item.value)}</span>
          </div>
          <div style={{ height: 9, background: '#eef0f3', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(item.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
