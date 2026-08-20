import { useState } from 'react';

function niceTop(m) {
  m = m || 1;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  const n = m / p;
  const q = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return q * p;
}

function fmtNum(n) {
  return (Math.round(n * 10) / 10).toLocaleString('vi-VN');
}

function autoScale(max, unit) {
  const u = unit ? ` ${unit}` : '';
  if (unit === 'đ') {
    if (max >= 1e9) return { divisor: 1e9, suffix: ' tỷ' };
    if (max >= 1e6) return { divisor: 1e6, suffix: ' triệu' };
    if (max >= 1e3) return { divisor: 1e3, suffix: ' nghìn' };
    return { divisor: 1, suffix: ' đ' };
  }
  if (max >= 1e6) return { divisor: 1e6, suffix: ` triệu${u}` };
  if (max >= 1e4) return { divisor: 1e3, suffix: ` nghìn${u}` };
  return { divisor: 1, suffix: u };
}

// Biểu đồ cột nhóm (grouped bars) — mỗi tháng 1 nhóm, mỗi hạng mục 1 cột riêng
// đứng cạnh nhau (không xếp chồng), giúp so sánh trực tiếp từng hạng mục qua
// các tháng theo cùng 1 thang trục Y, thay vì phải trừ lùi baseline như stacked bar.
export default function GroupedBars({ data, colors, seriesLabels, unit = '', height = 190 }) {
  const [hover, setHover] = useState(null);

  const hasData = data.length > 0 && data.some((d) => d.parts.some((v) => v > 0));
  if (!hasData) {
    return (
      <div style={{ height: Math.max(100, height * 0.55), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b6bf', fontSize: 13, gap: 8 }}>
        <i className="ph-duotone ph-clock-countdown" style={{ fontSize: 18 }} />
        Đang cập nhật
      </div>
    );
  }

  const w = 580;
  const ht = height;
  const pl = 46;
  const pr = 10;
  const pt = 12;
  const pb = 26;
  const iw = w - pl - pr;
  const ih = ht - pt - pb;

  const seriesCount = data[0]?.parts.length || 1;
  const rawMax = Math.max(...data.flatMap((d) => d.parts), 1);
  const { divisor, suffix } = autoScale(rawMax, unit);
  const scaled = data.map((d) => ({ ...d, parts: d.parts.map((v) => v / divisor) }));

  const max = Math.max(...scaled.flatMap((d) => d.parts), 1);
  const top = niceTop(max);
  const step = top / 5;
  const groupW = iw / (scaled.length || 1);
  const groupPad = groupW * 0.12;
  const barGap = 2;
  const barW = (groupW - groupPad * 2 - barGap * (seriesCount - 1)) / seriesCount;
  const x = (i) => pl + groupW * i + groupPad;
  const y = (v) => pt + ih - (v / top) * ih;

  const gridLines = [];
  for (let t = 0; t <= top + 1e-6; t += step) {
    gridLines.push(
      <g key={`g${t}`}>
        <line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} stroke="#eef0f3" />
        <text x={pl - 7} y={y(t) + 3} fontSize={10} textAnchor="end" fill="#8b929c">
          {fmtNum(t)}
        </text>
      </g>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${ht}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {gridLines}
        {scaled.map((d, i) =>
          d.parts.map((v, j) => {
            if (v <= 0) return null;
            const bx = x(i) + j * (barW + barGap);
            const by = y(v);
            const active = hover && hover.i === i && hover.j === j;
            return (
              <rect
                key={`${i}-${j}`}
                x={bx}
                y={by}
                width={Math.max(1, barW)}
                height={Math.max(0, pt + ih - by)}
                fill={colors[j]}
                opacity={active ? 0.82 : 1}
                rx={2}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover({ i, j, x: bx + barW / 2, y: by, value: v })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })
        )}
        {scaled.map((d, i) => (
          <text key={`l${i}`} x={x(i) + (groupW - groupPad * 2) / 2} y={ht - 9} fontSize={9.5} textAnchor="middle" fill="#8b929c">
            {d.label}
          </text>
        ))}
      </svg>
      {hover && (
        <div
          style={{
            position: 'absolute',
            left: `${(hover.x / w) * 100}%`,
            top: `${(hover.y / ht) * 100}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: -8,
            background: '#14161a',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 10px rgba(0,0,0,.25)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[hover.j], flex: 'none' }} />
            {seriesLabels?.[hover.j]} · {scaled[hover.i].label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {fmtNum(hover.value)}
            {suffix}
          </div>
        </div>
      )}
      {suffix && <div style={{ fontSize: 11, color: '#8b929c', textAlign: 'right', marginTop: -4 }}>Đơn vị: {suffix.trim()}</div>}
    </div>
  );
}
