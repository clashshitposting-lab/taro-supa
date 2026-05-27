interface Props {
  size?: number;
  className?: string;
}

const GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

export function ZodiacWheel({ size = 160, className }: Props) {
  const r = size / 2;
  const inner = r * 0.62;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <defs>
        <radialGradient id="zw-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.55 0.18 300 / 0.35)" />
          <stop offset="100%" stopColor="oklch(0.20 0.06 290 / 0)" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 2} fill="url(#zw-bg)" />
      <circle cx={r} cy={r} r={r - 4} fill="none" stroke="oklch(0.82 0.15 80 / 0.6)" strokeWidth="0.6" />
      <circle cx={r} cy={r} r={inner} fill="none" stroke="oklch(0.82 0.15 80 / 0.35)" strokeWidth="0.5" />
      {GLYPHS.map((g, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = r + Math.cos(a) * (r - 16);
        const y = r + Math.sin(a) * (r - 16);
        const x2 = r + Math.cos(a) * inner;
        const y2 = r + Math.sin(a) * inner;
        return (
          <g key={i}>
            <line x1={x2} y1={y2} x2={r + Math.cos(a) * (r - 4)} y2={r + Math.sin(a) * (r - 4)} stroke="oklch(0.82 0.15 80 / 0.25)" strokeWidth="0.4" />
            <text x={x} y={y} fill="oklch(0.95 0.10 80)" fontSize={size * 0.09} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "serif" }}>
              {g}
            </text>
          </g>
        );
      })}
      <circle cx={r} cy={r} r={3} fill="oklch(0.95 0.10 80)" />
    </svg>
  );
}