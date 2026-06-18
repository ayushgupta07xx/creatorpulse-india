"use client";

import { THEME } from "@/lib/theme";
import { formatCompact } from "@/lib/format";
import type { NicheForecastPoint } from "@/lib/api";

// Niche weekly-views forecast. Gradient-filled 80% interval, a glow yhat line, the
// forecast region (right of the history boundary) washed and the history clipped so
// the two read differently, plus an end-value label. Scales to container width with
// crisp non-scaling strokes.
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

  const W = 680;
  const H = 240;
  const padX = 14;
  const padTop = 22;
  const padBot = 30;
  const plotBot = H - padBot;

  const all = pts.flatMap((p) => [p.lo80, p.hi80, p.yhat]);
  const ymin = Math.min(...all);
  const ymax = Math.max(...all);
  const span = ymax - ymin || 1;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => padTop + (1 - (v - ymin) / span) * (plotBot - padTop);

  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.yhat).toFixed(1)}`).join(" ");
  const top = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.hi80).toFixed(1)}`);
  const bot = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.lo80).toFixed(1)}`).reverse();
  const band = [...top, ...bot].join(" ");
  const split = Math.max(0, n - horizon);
  const splitX = x(split);
  const last = pts[n - 1];
  const gridYs = [0.25, 0.5, 0.75].map((f) => padTop + f * (plotBot - padTop));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Niche weekly-views forecast with 80% interval"
    >
      <defs>
        <linearGradient id="fcBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.violet} stopOpacity="0.30" />
          <stop offset="100%" stopColor={THEME.violet} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* faint horizontal gridlines */}
      {gridYs.map((gy, i) => (
        <line
          key={i}
          x1={padX}
          y1={gy}
          x2={W - padX}
          y2={gy}
          stroke="#ffffff"
          strokeOpacity="0.05"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* forecast region wash */}
      {split > 0 && split < n && (
        <rect
          x={splitX}
          y={padTop}
          width={W - padX - splitX}
          height={plotBot - padTop}
          fill={THEME.violet}
          fillOpacity="0.05"
        />
      )}

      {/* 80% interval, gradient-filled */}
      <polygon points={band} fill="url(#fcBand)" />

      {/* yhat: soft halo under a crisp line */}
      <polyline
        points={line}
        fill="none"
        stroke={THEME.violet}
        strokeOpacity="0.22"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={line}
        fill="none"
        stroke={THEME.violet}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
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
          <circle cx={splitX} cy={y(pts[split].yhat)} r="3" fill={THEME.violet} />
          <text
            x={splitX + 5}
            y={padTop - 7}
            fill={THEME.muted}
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            forecast →
          </text>
        </>
      )}

      {/* end marker + value */}
      <circle cx={x(n - 1)} cy={y(last.yhat)} r="3.5" fill={THEME.violet} />
      <circle cx={x(n - 1)} cy={y(last.yhat)} r="6" fill={THEME.violet} fillOpacity="0.2" />
      <text
        x={W - padX}
        y={Math.max(padTop + 8, y(last.yhat) - 9)}
        fill="var(--ink, #e8e8ea)"
        fontSize="12"
        fontWeight="600"
        textAnchor="end"
        fontFamily="var(--font-mono)"
      >
        {formatCompact(last.yhat)}/wk
      </text>

      {/* date axis */}
      <text x={padX} y={H - 9} fill={THEME.muted} fontSize="11" fontFamily="var(--font-mono)">
        {pts[0].ds.slice(0, 10)}
      </text>
      <text
        x={W - padX}
        y={H - 9}
        fill={THEME.muted}
        fontSize="11"
        textAnchor="end"
        fontFamily="var(--font-mono)"
      >
        {last.ds.slice(0, 10)}
      </text>
    </svg>
  );
}
