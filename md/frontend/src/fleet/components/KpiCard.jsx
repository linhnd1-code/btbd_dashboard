export default function KpiCard({ label, value, unit, sub, icon, iconBg = '#eef4ff', iconColor = '#3b82f6' }) {
  return (
    <div
      className="card kpi-card"
      style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, boxSizing: 'border-box', '--kpi-accent': iconColor }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ font: '700 10px/1.35 var(--font-heading)', letterSpacing: '.05em', textTransform: 'uppercase', color: '#7a828e' }}>
          {label}
        </div>
        {icon && (
          <div
            className="kpi-icon-box"
            style={{
              width: 32,
              height: 32,
              flex: 'none',
              borderRadius: 9,
              background: `linear-gradient(145deg, ${iconBg}, color-mix(in srgb, ${iconBg} 70%, white))`,
              display: 'grid',
              placeItems: 'center',
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${iconColor} 18%, transparent)`,
            }}
          >
            <i className={`ph-duotone ph-${icon}`} style={{ fontSize: 16, color: iconColor }} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 25, lineHeight: 1.05, letterSpacing: '-.01em' }}>
        {value}
        {unit && <span style={{ fontSize: 13, fontWeight: 500, color: '#9aa1ab', marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#9aa1ab' }}>{sub}</div>}
    </div>
  );
}
