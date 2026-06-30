"use client";
import { THEME } from "@/lib/theme";
import { formatCompact } from "@/lib/format";
import type { NicheForecastPoint } from "@/lib/api";

// Honest "growth" visual: a single measured point (current subscribers) plus a
// dotted forward line scaled from the niche-demand trend — NOT measured channel
// history. Returns null if there's no forecast to project from.
export default function ProjectionChart({
  currentSubs,
  forecast,
  horizon = 12,
}: {
  currentSubs: number;
  forecast: NicheForecastPoint[] | null;
  horizon?: number;
}) {
  if (!forecast || forecast.length < 2) return null;
  const sorted = [...forecast].sort((a, b) => (a.ds < b.ds ? -1 : 1));
  const future = sorted.slice(Math.max(0, sorted.length - horizon));
  const base = future[0].yhat || 1;
  const proj = future.map((p) => currentSubs * (p.yhat / base));
  const n = proj.length;
  if (n < 2) return null;

  const W = 640;
  const H = 210;
  const padX = 14;
  const padTop = 22;
  const padBot = 30;
  const ymin = Math.min(currentSubs, ...proj);
  const ymax = Math.max(currentSubs, ...proj);
  const span = ymax - ymin || 1;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => padTop + (1 - (v - ymin) / span) * (H - padTop - padBot);

  // Smooth path (Catmull-Rom -> cubic bezier) for a premium curve, not a polyline.
  const pts = proj.map((v, i) => [x(i), y(v)] as const);
  const d = smoothPath(pts);
  const areaD = `${d} L ${x(n - 1).toFixed(1)},${(H - padBot).toFixed(1)} L ${x(0).toFixed(
    1,
  )},${(H - padBot).toFixed(1)} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Subscriber projection scaled from the niche trend"
    >
      <defs>
        <linearGradient id="proj-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.violet} stopOpacity="0.28" />
          <stop offset="100%" stopColor={THEME.violet} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="proj-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={THEME.teal} />
          <stop offset="100%" stopColor={THEME.violet} />
        </linearGradient>
        <filter id="proj-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* baseline */}
      <line
        x1={padX}
        x2={W - padX}
        y1={H - padBot}
        y2={H - padBot}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* area fill */}
      <path d={areaD} fill="url(#proj-area)" />

      {/* glow underlay + crisp dashed line on top */}
      <path
        d={d}
        fill="none"
        stroke="url(#proj-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
        filter="url(#proj-glow)"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        fill="none"
        stroke="url(#proj-line)"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* current-value marker with halo */}
      <circle cx={x(0)} cy={y(proj[0])} r="9" fill={THEME.teal} opacity="0.18" />
      <circle cx={x(0)} cy={y(proj[0])} r="4.5" fill={THEME.teal} filter="url(#proj-glow)" />

      {/* labels */}
      <text x={padX} y={H - 9} fill={THEME.ink} fontSize="12" fontFamily="var(--font-mono)">
        now
        <tspan fill={THEME.muted}> · {formatCompact(currentSubs)}</tspan>
      </text>
      <text
        x={W - padX}
        y={H - 9}
        fill={THEME.ink}
        fontSize="12"
        textAnchor="end"
        fontFamily="var(--font-mono)"
      >
        {/* projection end: no value — it's a niche-trend projection, not measured
            channel history, so a concrete subscriber number would mislead. */}
        +{n - 1}w
      </text>
    </svg>
  );
}

// Catmull-Rom through points -> smooth cubic bezier path string.
function smoothPath(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length < 2) return "";
  const p = pts;
  let d = `M ${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(
      1,
    )},${p2[1].toFixed(1)}`;
  }
  return d;
}
