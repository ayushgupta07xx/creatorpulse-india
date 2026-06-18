"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { getNiches, type NicheSummary } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import { THEME } from "@/lib/theme";
import Reveal from "@/components/Reveal";

function momentum(n: NicheSummary): number {
  if (n.slope == null || !n.median_views) return 0;
  return n.slope / n.median_views;
}

const SIZE = 116;
const R = 53;
const CIRC = 2 * Math.PI * R;

export default function NicheSections() {
  const [niches, setNiches] = useState<NicheSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    getNiches()
      .then(setNiches)
      .catch(() => setFailed(true));
  }, []);

  const { bubbles, rising, maxC, maxMom } = useMemo(() => {
    if (!niches) return { bubbles: [], rising: [], maxC: 1, maxMom: 1 };
    const maxC = Math.max(...niches.map((n) => n.creators), 1);
    const bubbles = [...niches].sort((a, b) => b.creators - a.creators);
    const rising = [...niches]
      .filter((n) => (n.slope ?? 0) > 0)
      .sort((a, b) => momentum(b) - momentum(a))
      .slice(0, 6);
    const maxMom = Math.max(...rising.map(momentum), 1e-9);
    return { bubbles, rising, maxC, maxMom };
  }, [niches]);

  if (failed) return null;
  if (!niches) return <p className="text-muted">Loading niche landscape…</p>;

  return (
    <div className="flex flex-col gap-20">
      <div>
        <Reveal>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            The niche landscape
          </h2>
          <p className="mt-2 max-w-xl text-muted">
            Every niche we track. The ring around each shows its share of creators; the
            colour reads demand direction — teal rising, pink cooling. Tap any to explore.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-7">
            {bubbles.map((b, i) => {
              const up = (b.slope ?? 0) > 0;
              const down = (b.slope ?? 0) < 0;
              const color = up ? THEME.teal : down ? THEME.pink : THEME.muted;
              const frac = b.creators / maxC;
              const dash = `${(frac * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`;
              return (
                <Link
                  key={b.niche}
                  href={`/niches/${encodeURIComponent(b.niche)}`}
                  className="shrink-0"
                  title={`${b.niche} · ${b.creators.toLocaleString("en-IN")} creators · median ${formatCompact(b.median_views ?? 0)} views · ${up ? "rising" : down ? "cooling" : "flat"}`}
                >
                  <motion.div
                    className="relative cursor-pointer"
                    style={{ width: SIZE, height: SIZE }}
                    animate={reduced ? undefined : { y: [0, -10, 0] }}
                    transition={
                      reduced
                        ? undefined
                        : {
                            duration: 3.6 + (i % 4) * 0.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: (i % 6) * 0.25,
                          }
                    }
                    whileHover={{ scale: 1.08 }}
                  >
                    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={THEME.line} strokeWidth="2" />
                      <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={R}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={dash}
                        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                      />
                    </svg>
                    <div
                      className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full text-center"
                      style={{ background: `radial-gradient(circle at 50% 32%, ${color}24, transparent 72%)` }}
                    >
                      <span className="px-1 text-[13px] font-semibold leading-tight text-ink">{b.niche}</span>
                      <span className="mt-0.5 font-mono text-[10px] text-muted">
                        {formatCompact(b.creators)}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>

      {rising.length > 0 && (
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Accelerating now
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Niches with the strongest upward demand momentum, ranked relative to their own
              typical reach.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 flex flex-col">
              {rising.map((n, i) => {
                const w = Math.max(8, (momentum(n) / maxMom) * 100);
                const isLast = i === rising.length - 1;
                return (
                  <Link
                    key={n.niche}
                    href={`/niches/${encodeURIComponent(n.niche)}`}
                    className={`group flex items-baseline gap-5 py-5 transition-colors hover:bg-white/[0.02] ${isLast ? "" : "border-b border-white/5"}`}
                  >
                    <span className="font-display text-2xl font-bold tabular-nums text-white/15">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="truncate font-semibold text-ink group-hover:text-teal">
                          {n.niche}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {formatCompact(n.creators)} creators
                        </span>
                      </div>
                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          className="h-full rounded-full bg-teal"
                          initial={reduced ? false : { width: 0 }}
                          whileInView={reduced ? undefined : { width: `${w}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                          style={reduced ? { width: `${w}%` } : undefined}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Reveal>

          <p className="mt-4 max-w-2xl text-xs text-muted">
            Momentum = forecast trend slope ÷ typical views (relative, so big niches don&apos;t
            dominate on volume alone). The weekly demand series is simulated — no real demand
            history yet.
          </p>
        </div>
      )}
    </div>
  );
}
