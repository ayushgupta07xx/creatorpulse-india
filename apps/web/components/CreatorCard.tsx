"use client";

import { useState } from "react";
import type { CreatorSummary } from "@/lib/api";
import {
  formatCompact,
  formatINR,
  humanizeArchetype,
  riskLabel,
  riskLevel,
} from "@/lib/format";

const RISK_CLASS: Record<string, string> = {
  low: "border-risk-low/40 text-risk-low",
  mid: "border-risk-mid/40 text-risk-mid",
  high: "border-risk-high/40 text-risk-high",
};

function initials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function CreatorCard({ c }: { c: CreatorSummary }) {
  // yt3 CDN blocks hotlinking without no-referrer; fall back to initials on error.
  const [imgOk, setImgOk] = useState(true);
  const level = riskLevel(c.fraud_risk);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet/40 via-teal/15 to-white/5 p-px transition-transform duration-300 hover:-translate-y-1">
      <div className="flex h-full flex-col rounded-[15px] bg-surface/90 p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          {imgOk && c.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.thumbnail_url}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgOk(false)}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal font-mono text-sm font-bold text-bg">
              {initials(c.title)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink">{c.title}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted">
                {c.niche}
              </span>
              <span
                className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted"
                title="Behavioral cluster — a cohort label, not necessarily the channel's niche"
              >
                {humanizeArchetype(c.archetype)}
              </span>
              {c.is_short && (
                <span
                  className="rounded bg-violet/15 px-2 py-0.5 text-xs font-medium text-violet"
                  title="Short-form channel — integration priced at the Shorts rate (~0.5× long-form)"
                >
                  Shorts
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Subscribers</dt>
            <dd className="font-mono text-ink">{formatCompact(c.subscriber_count)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Median views</dt>
            <dd className="font-mono text-ink">
              {formatCompact(c.median_views ?? c.mean_views)}
              <span className="text-muted">
                {" · "}
                {c.video_count === 1 ? "1 video" : `${formatCompact(c.video_count)} videos`}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Est. sponsor cost</dt>
            <dd
              className="font-mono text-ink"
              title="Roughly what a brand might pay to sponsor one video — estimated from the creator’s audience size, not a quote."
            >
              {(() => {
                if (c.cost_basis === "insufficient") return "Insufficient history";
                if (c.cost_basis === "unverified") return "Format unverified";
                const lo = formatINR(c.est_cost_low_inr);
                const hi = formatINR(c.est_cost_high_inr);
                if (lo !== hi) return `${lo}–${hi}`;
                const note =
                  c.cost_basis === "cap"
                    ? " (capped)"
                    : c.cost_basis === "base"
                      ? " (base rate)"
                      : "";
                return `${lo}${note}`;
              })()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Engagement risk</dt>
            <dd>
              {c.cost_basis === "insufficient" ? (
                <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-xs font-semibold text-muted">
                  Limited history
                </span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${RISK_CLASS[level]}`}
                >
                  {riskLabel(level)}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
