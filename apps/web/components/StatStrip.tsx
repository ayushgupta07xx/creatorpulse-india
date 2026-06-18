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
          className="rounded-2xl border border-white/10 bg-surface px-6 py-6"
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
