"use client";

import { useEffect, useState } from "react";
import { getStats, type Stats } from "@/lib/api";
import CountUp from "./CountUp";

// Counts read live from /stats so the numbers can never drift from the corpus
// the API serves; CountUp animates them in on view.
export default function StatStrip() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  const items: { label: string; value: number | undefined }[] = [
    { label: "Indian creators indexed", value: stats?.creators },
    { label: "Niches tracked", value: stats?.niches },
    { label: "Behavioral archetypes", value: stats?.archetypes },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="card-fill group rounded-2xl px-6 py-6 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_12px_30px_-18px_rgba(0,0,0,0.85),0_0_24px_-8px_rgba(84,224,206,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-teal/25 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-18px_rgba(0,0,0,0.9),0_0_34px_-6px_rgba(84,224,206,0.32)]"
        >
          <div className="font-display text-3xl font-bold tracking-tight text-ink">
            {it.value === undefined ? (
              failed ? (
                "—"
              ) : (
                "···"
              )
            ) : (
              <CountUp to={it.value} />
            )}
          </div>
          <div className="mt-1.5 text-sm text-muted">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
