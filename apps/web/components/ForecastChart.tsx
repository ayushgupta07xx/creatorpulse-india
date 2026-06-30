"use client";

import { THEME } from "@/lib/theme";
import { formatCompact } from "@/lib/format";
import type { NicheForecastPoint } from "@/lib/api";

// Niche weekly-views forecast: gradient-filled measured history that turns dotted
// for the 12-week forecast, an 80% interval shaded over the forecast region, a
// glowing teal "present" marker at the split, and clean two-tone corner labels.
export default function ForecastChart({
  forecast,
  horizon = 12,
}: {
  forecast: NicheForecastPoint[];
  horizon?: number;
}) {
  const pts = [...forecast].sort((a, b) => (a.ds < b.ds ? -1 : 1));
  const n = pts.length;
  if (n < 2) {
    return <p className="text-sm text-muted">Not enough forecast data to chart.</p>;
  }

  const W = 640;
  const H = 210;
  const padX = 14;
  const padTop = 22;
  const padBot = 30;
  const plotBot = H - padBot;

  const split = Math.max(0, n - horizon);

  const all = pts.flatMap((p, i) => (i >= split ? [p.lo80, p.hi80, p.yhat] : [p.yhat]));
  const ymin = Math.min(...all);
  const ymax = Math.max(...all);
  const span = ymax - ymin || 1;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => padTop + (1 - (v - ymin) / span) * (plotBot - padTop);

  // Smooth history path + area fill.
  const histPts = pts.slice(0, split + 1).map((p, i) => [x(i), y(p.yhat)] as const);
  const histD = smoothPath(histPts);
  const histArea =
    histPts.length >= 2
      ? `${histD} L ${histPts[histPts.length - 1][0].toFixed(1)},${plotBot.toFixed(
          1,
        )} L ${histPts[0][0].toFixed(1)},${plotBot.toFixed(1)} Z`
      : "";

  // Smooth forecast path (dotted).
  const fcPts = pts.slice(split);
  const fcXY = fcPts.map((p, i) => [x(split + i), y(p.yhat)] as const);
  const fcD = smoothPath(fcXY);

  // 80% interval polygon over the forecast region.
  const top = fcPts.map((p, i) => `${x(split + i).toFixed(1)},${y(p.hi80).toFixed(1)}`);
  const bot = fcPts
    .map((p, i) => `${x(split + i).toFixed(1)},${y(p.lo80).toFixed(1)}`)
    .reverse();
  const band = [...top, ...bot].join(" ");

  const splitX = x(split);
  const last = pts[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Niche weekly-views forecast with 80% interval"
    >
      <defs>
        <linearGradient id="fc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.violet} stopOpacity="0.26" />
          <stop offset="100%" stopColor={THEME.violet} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fc-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={THEME.teal} />
          <stop offset="100%" stopColor={THEME.violet} />
        </linearGradient>
        <linearGradient id="fc-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.violet} stopOpacity="0.20" />
          <stop offset="100%" stopColor={THEME.violet} stopOpacity="0.04" />
        </linearGradient>
        <filter id="fc-glow" x="-20%" y="-20%" width="140%" height="140%">
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
        y1={plotBot}
        y2={plotBot}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* 80% interval, forecast region only */}
      {fcPts.length >= 2 && <polygon points={band} fill="url(#fc-band)" />}

      {/* history area fill */}
      {histArea && <path d={histArea} fill="url(#fc-area)" />}

      {/* history: smooth, glow underlay + crisp line */}
      {split >= 1 && (
        <>
          <path
            d={histD}
            fill="none"
            stroke="url(#fc-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.45"
            filter="url(#fc-glow)"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={histD}
            fill="none"
            stroke="url(#fc-line)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}

      {/* forecast: dotted */}
      <path
        d={fcD}
        fill="none"
        stroke={THEME.violet}
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* history / forecast boundary */}
      {split > 0 && split < n && (
        <>
          <line
            x1={splitX}
            y1={padTop}
            x2={splitX}
            y2={plotBot}
            stroke={THEME.muted}
            strokeWidth="1"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={splitX} cy={y(pts[split].yhat)} r="9" fill={THEME.teal} opacity="0.18" />
          <circle
            cx={splitX}
            cy={y(pts[split].yhat)}
            r="4.5"
            fill={THEME.teal}
            filter="url(#fc-glow)"
          />
          <text
            x={splitX + 8}
            y={padTop + 4}
            fill={THEME.muted}
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            forecast
          </text>
        </>
      )}

      {/* corner labels */}
      <text x={padX} y={H - 9} fill={THEME.muted} fontSize="12" fontFamily="var(--font-mono)">
        {pts[0].ds.slice(0, 10)}
      </text>
      <text
        x={W - padX}
        y={H - 9}
        fill={THEME.ink}
        fontSize="12"
        textAnchor="end"
        fontFamily="var(--font-mono)"
      >
        {last.ds.slice(0, 10)}
        <tspan fill={THEME.muted}> · {formatCompact(last.yhat)}/wk</tspan>
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
