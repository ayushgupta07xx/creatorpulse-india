import Link from "next/link";

const PERSONAS = [
  {
    tag: "For creators",
    title: "See what's actually working in your niche",
    body: "Search your channel for a growth read, an engagement-quality percentile against your archetype, a 12-week niche-demand forecast, and the peers closest to you.",
    cta: "Search a creator",
    href: "/creators",
  },
  {
    tag: "For brands",
    title: "Find creators worth the spend — screened first",
    body: "Brief a campaign and budget, get a ranked shortlist matched on content fit and reach, each one screened for engagement risk before you ever reach out.",
    cta: "Brief a campaign",
    href: "/brands",
  },
];

export default function PersonaSplit() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {PERSONAS.map((p) => (
        <div
          key={p.tag}
          className="flex flex-col rounded-2xl border border-white/10 bg-surface p-7 transition-transform duration-300 hover:-translate-y-1 hover:border-white/20"
        >
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-teal">
            {p.tag}
          </span>
          <h3 className="mt-3 font-display text-xl font-bold text-ink">
            {p.title}
          </h3>
          <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">
            {p.body}
          </p>
          <Link
            href={p.href}
            className="btn-sheen mt-7 inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:border-violet hover:bg-violet/10 hover:text-violet focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
          >
            {p.cta} →
          </Link>
        </div>
      ))}
    </div>
  );
}
