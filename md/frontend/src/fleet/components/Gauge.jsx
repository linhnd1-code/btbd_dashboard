export default function Gauge({ score, size = 150 }) {
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = size * 0.38;
  const thick = size * 0.09;
  const color = score >= 85 ? '#16a34a' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#e5484d';
  const a0 = Math.PI;
  const a1 = 0;
  const ang = a0 + (a1 - a0) * (score / 100);
  const pol = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arcPath = (as, ae) => {
    const [x1, y1] = pol(as);
    const [x2, y2] = pol(ae);
    const large = ae - as > Math.PI ? 1 : 0;
    return `M${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const [nx, ny] = pol(ang);

  return (
    <svg width={size} height={cy + 18} viewBox={`0 0 ${size} ${cy + 18}`}>
      <path d={arcPath(a0, a1)} fill="none" stroke="#edeff2" strokeWidth={thick} strokeLinecap="round" />
      <path d={arcPath(a0, ang)} fill="none" stroke={color} strokeWidth={thick} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#201e1d" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#201e1d" />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize={size * 0.22} fontWeight={700} fill={color}>
        {score}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="#9aa1ab">
        / 100
      </text>
    </svg>
  );
}
