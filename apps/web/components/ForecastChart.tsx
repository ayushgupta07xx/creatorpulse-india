"use client";

import { THEME } from "@/lib/theme";
import { formatCompact } from "@/lib/format";
import type { NicheForecastPoint } from "@/lib/api";

// Niche weekly-views forecast, styled to match ProjectionChart: a solid measured
// history line that turns dotted for the 12-week forecast, the 80% interval shaded
// only over the forecast region, a teal "present" marker at the split, and clean
// date/value corner labels. Scales to container width with non-scaling strokes.
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
  const H = 200;
  const padX = 10;
  const padTop = 16;
  const padBot = 26;
  const plotBot = H - padBot;

  const split = Math.max(0, n - horizon); // index where the forecast begins

  // Only the forecast region carries an interval; history is the measured anchor.
  const all = pts.flatMap((p, i) => (i >= split ? [p.lo80, p.hi80, p.yhat] : [p.yhat]));
  const ymin = Math.min(...all);
  const ymax = Math.max(...all);
  const span = ymax - ymin || 1;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => padTop + (1 - (v - ymin) / span) * (plotBot - padTop);

  // History: solid, indices 0..split (inclusive, so it meets the forecast line).
  const hist = pts
    .slice(0, split + 1)
    .map((p, i) => `${x(i).toFixed(1)},${y(p.yhat).toFixed(1)}`)
    .join(" ");
  // Forecast: dotted, indices split..n-1 (matches ProjectionChart's dotted future).
  const fcPts = pts.slice(split);
  const fc = fcPts.map((p, i) => `${x(split + i).toFixed(1)},${y(p.yhat).toFixed(1)}`).join(" ");

  // 80% interval polygon over the forecast region only.
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
      {/* 80% interval, forecast region only */}
      {fcPts.length >= 2 && <polygon points={band} fill={THEME.violet} fillOpacity="0.12" />}

      {/* measured history: solid */}
      {split >= 1 && (
        <polyline
          points={hist}
          fill="none"
          stroke={THEME.violet}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* forecast: dotted */}
      <polyline
        points={fc}
        fill="none"
        stroke={THEME.violet}
        strokeWidth="2"
        strokeDasharray="5 4"
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
          <circle cx={splitX} cy={y(pts[split].yhat)} r="4" fill={THEME.teal} />
          <text
            x={splitX + 6}
            y={padTop + 4}
            fill={THEME.muted}
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            forecast
          </text>
        </>
      )}

      {/* corner labels, ProjectionChart-style */}
      <text x={padX} y={H - 8} fill={THEME.muted} fontSize="11" fontFamily="var(--font-mono)">
        {pts[0].ds.slice(0, 10)}
      </text>
      <text
        x={W - padX}
        y={H - 8}
        fill={THEME.muted}
        fontSize="11"
        textAnchor="end"
        fontFamily="var(--font-mono)"
      >
        {last.ds.slice(0, 10)} · {formatCompact(last.yhat)}/wk
      </text>
    </svg>
  );
}
