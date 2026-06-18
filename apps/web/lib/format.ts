// Display formatters. Subs/views use M/K (globally legible for creator metrics);
// money uses Indian lakh/crore (how brand budgets are quoted: the brief is ₹1L–50L).

export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) {
    const b = n / 1_000_000_000;
    return `${(b >= 100 ? b.toFixed(0) : b.toFixed(1)).replace(/\.0$/, "")}B`;
  }
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${(m >= 100 ? m.toFixed(0) : m.toFixed(1)).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000)}K`;
  }
  return String(Math.round(n));
}

export function formatINR(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1_000) return `₹${Math.round(n / 1_000)}K`;
  return `₹${Math.round(n)}`;
}

export function humanizeArchetype(a: string): string {
  return a
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type RiskLevel = "low" | "mid" | "high";

export function riskLevel(score: number): RiskLevel {
  if (score < 0.34) return "low";
  if (score < 0.67) return "mid";
  return "high";
}

const RISK_COPY: Record<RiskLevel, string> = {
  low: "Low risk",
  mid: "Worth a look",
  high: "High risk",
};

export function riskLabel(level: RiskLevel): string {
  return RISK_COPY[level];
}
