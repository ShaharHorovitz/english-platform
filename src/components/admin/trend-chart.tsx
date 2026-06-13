/** Rolling 7-day success-rate trend — a token-driven SVG line/area chart, no
 * chart library. Native title tooltips on dots. Pattern via Magic inspiration. */
export function TrendChart({
  data,
}: {
  data: { date: string; rate: number }[];
}) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough activity yet to chart a trend.
      </p>
    );
  }

  const W = 640;
  const H = 180;
  const pad = { t: 16, r: 16, b: 22, l: 30 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / (data.length - 1)) * plotW;
  const y = (r: number) => pad.t + (1 - r / 100) * plotH;

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)},${y(d.rate).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${x(data.length - 1).toFixed(1)},${pad.t + plotH} L ${x(0).toFixed(1)},${pad.t + plotH} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Rolling 7-day success rate over time"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <text
            x={pad.l - 6}
            y={y(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {v}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#trend-fill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.rate)} r="3" fill="var(--primary)">
          <title>{`${d.date}: ${d.rate}%`}</title>
        </circle>
      ))}
    </svg>
  );
}
