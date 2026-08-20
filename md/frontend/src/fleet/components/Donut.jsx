export default function Donut({ segments, size = 150, thickness = 26, centerLabel, centerSub, labelSize = 20, subSize = 10 }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let offset = 0;

  const hasData = segments.some((s) => s.value > 0);
  if (!hasData) {
    return (
      <div style={{ width: size, height: size, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b0b6bf', fontSize: 12.5, gap: 6 }}>
        <i className="ph-duotone ph-clock-countdown" style={{ fontSize: 20 }} />
        Đang cập nhật
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edeff2" strokeWidth={thickness} />
        {segments
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const len = (c * s.value) / total;
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                <title>
                  {s.label}: {s.value} ({Math.round((s.value / total) * 100)}%)
                </title>
              </circle>
            );
            offset += len;
            return el;
          })}
      </svg>
      {(centerLabel !== undefined || centerSub) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {centerLabel !== undefined && <div style={{ font: `700 ${labelSize}px var(--font-heading)`, color: '#14161a' }}>{centerLabel}</div>}
          {centerSub && <div style={{ fontSize: subSize, color: '#8b929c', textTransform: 'uppercase', letterSpacing: '.04em' }}>{centerSub}</div>}
        </div>
      )}
    </div>
  );
}
