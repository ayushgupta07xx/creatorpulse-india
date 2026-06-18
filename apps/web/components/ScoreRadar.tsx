"use client";

import { THEME } from "@/lib/theme";

// Static SVG pentagon radar for a match's score breakdown. The five axes are the
// re-rank components from the match engine (each 0..1); "Safety" is 1 - fraud_risk
// so a fuller shape always reads as a better fit.
const AXES = [
  { key: "content", label: "Content" },
  { key: "niche", label: "Niche" },
  { key: "budget", label: "Budget" },
  { key: "reach", label: "Reach" },
  { key: "safety", label: "Safety" },
] as const;

type RadarValues = {
  content: number;
  niche: number;
  budget: number;
  reach: number;
  safety: number;
};

export default function ScoreRadar({
  values,
  size = 150,
}: {
  values: RadarValues;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 24;
  const n = AXES.length;

  const pt = (i: number, r: number): readonly [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const rings = [0.25, 0.5, 0.75, 1].map((g) =>
    AXES.map((_, i) => pt(i, R * g).join(",")).join(" "),
  );

  const shape = AXES.map((ax, i) => {
    const v = Math.max(0, Math.min(1, values[ax.key]));
    return pt(i, R * v).join(",");
  }).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Match score breakdown"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="cp-radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={THEME.violet} stopOpacity="0.55" />
          <stop offset="100%" stopColor={THEME.teal} stopOpacity="0.30" />
        </linearGradient>
      </defs>

      {rings.map((points, i) => (
        <polygon key={i} points={points} fill="none" stroke={THEME.line} strokeWidth="1" />
      ))}

      {AXES.map((_, i) => {
        const [x, y] = pt(i, R);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={THEME.line} strokeWidth="1" />
        );
      })}

      <polygon points={shape} fill="url(#cp-radar-fill)" stroke={THEME.violet} strokeWidth="1.5" />

      {AXES.map((ax, i) => {
        const [x, y] = pt(i, R + 13);
        return (
          <text
            key={ax.key}
            x={x}
            y={y}
            fill={THEME.muted}
            fontSize="9"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono)"
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}
