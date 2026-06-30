"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { getNiches, type NicheSummary } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import { THEME } from "@/lib/theme";
import Reveal from "@/components/Reveal";
import InfoHint from "@/components/InfoHint";

function momentum(n: NicheSummary): number {
  if (n.slope == null || !n.median_views) return 0;
  return n.slope / n.median_views;
}

const MATTE =
  "card-fill group relative overflow-hidden rounded-xl p-4 " +
  "ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_12px_30px_-18px_rgba(0,0,0,0.85),0_0_24px_-8px_rgba(84,224,206,0.16)] " +
  "transition-all duration-200 hover:-translate-y-0.5 hover:ring-teal/25 " +
  "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-18px_rgba(0,0,0,0.9),0_0_34px_-6px_rgba(84,224,206,0.32)]";

export default function NicheSections() {
  const [niches, setNiches] = useState<NicheSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    getNiches()
      .then(setNiches)
      .catch(() => setFailed(true));
  }, []);

  const { top6, rising, maxMom } = useMemo(() => {
    if (!niches) return { top6: [], rising: [], maxMom: 1 };
    const top6 = [...niches].sort((a, b) => b.creators - a.creators).slice(0, 6);
    const rising = [...niches]
      .filter((n) => (n.slope ?? 0) > 0)
      .sort((a, b) => momentum(b) - momentum(a))
      .slice(0, 6);
    const maxMom = Math.max(...rising.map(momentum), 1e-9);
    return { top6, rising, maxMom };
  }, [niches]);

  if (failed) return null;
  if (!niches) return <p className="text-muted">Loading niche landscape…</p>;

  return (
    <div className="flex flex-col gap-20">
      <div>
        <Reveal>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Niches at a glance
          </h2>
          <p className="mt-2 max-w-xl text-muted">
            The most crowded niches we track, with demand direction.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {top6.map((b) => {
              const up = (b.slope ?? 0) > 0;
              const down = (b.slope ?? 0) < 0;
              const color = up ? THEME.teal : down ? THEME.pink : THEME.muted;
              const dir = up ? "Rising" : down ? "Cooling" : "Flat";
              return (
                <Link
                  key={b.niche}
                  href={`/niches/${encodeURIComponent(b.niche)}`}
                  title={`${b.niche} · ${b.creators.toLocaleString("en-IN")} creators · median ${formatCompact(b.median_views ?? 0)} views · ${dir.toLowerCase()}`}
                  className={MATTE}
                >
                  <div>
                    <span className="font-semibold leading-tight text-ink">{b.niche}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl font-bold tabular-nums text-ink">
                      {formatCompact(b.creators)}
                    </span>
                    <span className="text-[11px] text-muted">creators</span>
                  </div>
                  <div className="mt-1.5 text-[11px] font-medium" style={{ color }}>
                    {dir}
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Link
            href="/niches"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-surface2 to-surface px-5 py-2.5 text-sm font-semibold text-teal ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_24px_-16px_rgba(0,0,0,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-teal/40"
          >
            See all niches
          </Link>
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
            <div className="leaderboard-card mt-8 overflow-hidden rounded-2xl ring-1 ring-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_18px_44px_-22px_rgba(0,0,0,0.9)]">
              {rising.map((n, i) => {
                const w = Math.max(8, (momentum(n) / maxMom) * 100);
                const isLast = i === rising.length - 1;
                const isTop = i === 0;
                const top3 = i < 3;
                return (
                  <Link
                    key={n.niche}
                    href={`/niches/${encodeURIComponent(n.niche)}`}
                    className={`group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03] ${isLast ? "" : "border-b border-white/[0.05]"} ${isTop ? "bg-teal/[0.04]" : ""}`}
                  >
                    {isTop && <span className="absolute inset-y-0 left-0 w-0.5 bg-teal" />}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold tabular-nums ${
                        top3
                          ? "bg-teal/15 text-teal ring-1 ring-teal/30"
                          : "bg-white/[0.04] text-muted ring-1 ring-white/[0.06]"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="truncate font-semibold text-ink group-hover:text-teal">
                          {n.niche}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {formatCompact(n.creators)} creators
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                          className="h-full rounded-full bg-teal/80"
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

          <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            The weekly demand series is simulated — no real demand history yet.
            <InfoHint label="How momentum is computed">
              Momentum = forecast trend slope ÷ typical views (relative, so big niches
              don&apos;t dominate on volume alone).
            </InfoHint>
          </p>
        </div>
      )}
    </div>
  );
}
