"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState, { AlertIcon } from "@/components/EmptyState";
import SkeletonGrid from "@/components/SkeletonGrid";
import Link from "next/link";
import { getNiches, type NicheSummary } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import Reveal from "@/components/Reveal";
import InfoHint from "@/components/InfoHint";

function momentum(n: NicheSummary): number {
  if (n.slope == null || !n.median_views) return 0;
  return n.slope / n.median_views;
}

type Sort = "creators" | "rising";

export default function NichesPage() {
  const [niches, setNiches] = useState<NicheSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<Sort>("creators");

  useEffect(() => {
    getNiches()
      .then(setNiches)
      .catch(() => setFailed(true));
  }, []);

  const rows = useMemo(() => {
    if (!niches) return [];
    const r = [...niches];
    if (sort === "creators") r.sort((a, b) => b.creators - a.creators);
    else r.sort((a, b) => momentum(b) - momentum(a));
    return r;
  }, [niches, sort]);

  return (
    <div className="mx-auto max-w-wrap px-6 py-12">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            The niche landscape
          </h1>
          <InfoHint label="About the niche landscape" placement="left">
            Every niche we track across the indexed corpus — how crowded it is, the reach and
            engagement a typical creator sees, and which way demand is heading. Open one for its
            forecast and top creators.
          </InfoHint>
        </div>
      </Reveal>

      <div className="mt-7 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-surface p-1 text-sm">
        <button
          onClick={() => setSort("creators")}
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            sort === "creators" ? "bg-white/[0.06] text-ink" : "text-muted hover:text-ink"
          }`}
        >
          Most crowded
        </button>
        <button
          onClick={() => setSort("rising")}
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            sort === "rising" ? "bg-white/[0.06] text-ink" : "text-muted hover:text-ink"
          }`}
        >
          Fastest rising
        </button>
      </div>

      {failed && (
        <EmptyState
          tone="error"
          icon={<AlertIcon />}
          title="Couldn't load niches"
          body="The API may be waking up — try again shortly."
        />
      )}
      {!niches && !failed && <SkeletonGrid variant="niche" count={6} />}

      {niches && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((n, i) => {
            const up = (n.slope ?? 0) > 0;
            const down = (n.slope ?? 0) < 0;
            const dir = up ? "Rising" : down ? "Cooling" : "Flat";
            const arrow = up ? "↑" : down ? "↓" : "→";
            const accent = up ? "bg-teal" : down ? "bg-pink" : "bg-white/15";
            const tone = up ? "text-teal" : down ? "text-pink" : "text-muted";
            return (
              <Reveal key={n.niche} delay={Math.min(i * 0.03, 0.3)}>
                <Link
                  href={`/niches/${encodeURIComponent(n.niche)}`}
                  className="group relative block h-full overflow-hidden rounded-2xl bg-gradient-to-b from-surface2 to-surface p-5 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_12px_30px_-18px_rgba(0,0,0,0.85)] transition-all duration-200 hover:-translate-y-1 hover:ring-white/15"
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden />
                  <span
                    className="pointer-events-none absolute -right-1 -top-4 select-none font-display text-7xl font-bold leading-none text-white/[0.04]"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="relative">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
                      <span aria-hidden>{arrow}</span>
                      {dir}
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink transition-colors group-hover:text-teal">
                      {n.niche}
                    </h2>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-bold text-ink">
                        {formatCompact(n.creators)}
                      </span>
                      <span className="text-xs text-muted">creators</span>
                    </div>

                    <div className="mt-4 flex items-center gap-4 border-t border-white/[0.06] pt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-sm text-ink">
                          {n.median_views == null ? "—" : formatCompact(n.median_views)}
                        </span>
                        <span className="text-xs text-muted">median views</span>
                      </div>
                      <span className="h-3 w-px bg-white/10" aria-hidden />
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-sm text-ink">
                          {n.median_engagement_rate == null
                            ? "—"
                            : `${(n.median_engagement_rate * 100).toFixed(1)}%`}
                        </span>
                        <span className="text-xs text-muted">median ER</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
