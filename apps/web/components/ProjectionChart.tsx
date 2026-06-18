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
  const H = 200;
  const padX = 10;
  const padTop = 16;
  const padBot = 26;
  const ymin = Math.min(currentSubs, ...proj);
  const ymax = Math.max(currentSubs, ...proj);
  const span = ymax - ymin || 1;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => padTop + (1 - (v - ymin) / span) * (H - padTop - padBot);
  const line = proj.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Subscriber projection scaled from the niche trend"
    >
      <polyline
        points={line}
        fill="none"
        stroke={THEME.violet}
        strokeWidth="2"
        strokeDasharray="5 4"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={x(0)} cy={y(proj[0])} r="5" fill={THEME.teal} />
      <text x={padX} y={H - 8} fill={THEME.muted} fontSize="11" fontFamily="var(--font-mono)">
        now · {formatCompact(currentSubs)}
      </text>
      <text
        x={W - padX}
        y={H - 8}
        fill={THEME.muted}
        fontSize="11"
        textAnchor="end"
        fontFamily="var(--font-mono)"
      >
        +{n - 1}w · {formatCompact(proj[n - 1])}
      </text>
    </svg>
  );
}
