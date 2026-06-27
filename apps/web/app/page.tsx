import Link from "next/link";
import AuroraBackground from "@/components/AuroraBackground";
import Reveal from "@/components/Reveal";
import InfoHint from "@/components/InfoHint";
import StatStrip from "@/components/StatStrip";
import NicheSections from "@/components/NicheSections";
import ScrollProgress from "@/components/ScrollProgress";

const MEASURED = [
  {
    k: "Engagement quality",
    v: "Like and comment rates, consistency, and a percentile within each creator's niche — straight from observed videos.",
  },
  {
    k: "Reach & pricing",
    v: "Average and median views, plus a reach-based sponsored-cost proxy per integration.",
  },
  {
    k: "Behavioral archetypes",
    v: "K-means clusters over engagement and cadence features — a cohort label, distinct from niche.",
  },
  {
    k: "Engagement-risk screen",
    v: "A heuristic read on engagement patterns — surfaced as a screen, never as platform-verified fraud.",
  },
];

const SIMULATED = [
  {
    k: "Niche-demand history",
    v: "Weekly demand series are simulated; the 12-week forecast is labeled as such throughout.",
  },
  {
    k: "Growth projection",
    v: "Per-channel growth is a niche-trend projection, not measured history — longitudinal tracking accrues from the first snapshot.",
  },
  {
    k: "A/B & cohort results",
    v: "Pre-launch experiments run on simulated cohorts, labeled wherever a number appears.",
  },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5l3.2 3.2L13 4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.5 9c1.3-2.6 2.8-2.6 4.2 0s2.9 2.6 4.2 0 2.8-2.6 4.6 0" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <ScrollProgress />

      {/* hero */}
      <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center overflow-hidden">
        <AuroraBackground />
        <div className="relative z-10 mx-auto w-full max-w-wrap px-6">
          <div className="max-w-3xl">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
                Creator economy intelligence · India
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.03] tracking-tight text-ink sm:text-6xl lg:text-7xl">
                The intelligence layer for India&apos;s{" "}
                <span className="bg-gradient-to-r from-violet to-teal bg-clip-text text-transparent">
                  creator economy
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Growth, niche demand, and an honest engagement read on thousands of Indian
                creators. Search one you know — or brief a campaign and get a screened
                shortlist.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/creators"
                  className="btn-sheen inline-flex items-center rounded-xl bg-ink px-7 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
                >
                  Search a creator
                </Link>
                <Link
                  href="/brands"
                  className="inline-flex items-center rounded-xl border border-white/15 px-7 py-4 text-sm font-semibold text-ink transition-colors hover:border-violet hover:text-violet focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
                >
                  Brief a campaign
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* by the numbers */}
      <section className="mx-auto max-w-wrap px-6 py-20">
        <Reveal>
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              By the numbers
            </h2>
            <InfoHint label="About these numbers" placement="left">
              One corpus of Indian creators, read live from the API — these counts can&apos;t
              drift from what the product actually serves.
            </InfoHint>
          </div>
        </Reveal>
        <div className="mt-8">
          <StatStrip />
        </div>
      </section>

      {/* niche landscape + accelerating */}
      <section className="mx-auto max-w-wrap px-6 py-20">
        <NicheSections />
      </section>

      {/* methodology */}
      <section className="mx-auto max-w-wrap px-6 py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Honest by construction
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Every figure is labeled for what it is — what&apos;s measured from real data, and
            what&apos;s a simulated stand-in until live history accrues.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-surface/60 p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal/70 to-transparent" />
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/15 text-teal">
                  <CheckIcon />
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-teal">
                  Measured from real data
                </span>
              </div>
              <ul className="mt-5 flex flex-col divide-y divide-white/5">
                {MEASURED.map((r) => (
                  <li key={r.k} className="py-4 first:pt-2 last:pb-0">
                    <div className="font-semibold text-ink">{r.k}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted">{r.v}</div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-surface/60 p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet/70 to-transparent" />
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet/15 text-violet">
                  <WaveIcon />
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet">
                  Simulated, always labeled
                </span>
              </div>
              <ul className="mt-5 flex flex-col divide-y divide-white/5">
                {SIMULATED.map((r) => (
                  <li key={r.k} className="py-4 first:pt-2 last:pb-0">
                    <div className="font-semibold text-ink">{r.k}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted">{r.v}</div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* closing band — the two ways in, merged with the CTA */}
      <section className="mx-auto max-w-wrap px-6 pb-24 pt-8">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet/15 via-surface to-teal/10 p-8 sm:p-12">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 md:divide-x md:divide-white/10">
              <div className="md:pr-10">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-teal">
                  For creators
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
                  See what&apos;s actually working in your niche
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  Search your channel for a growth read, an engagement-quality percentile
                  against your archetype, a 12-week niche-demand forecast, and the peers
                  closest to you.
                </p>
                <Link
                  href="/creators"
                  className="btn-sheen mt-6 inline-flex items-center rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
                >
                  Search a creator
                </Link>
              </div>
              <div className="md:pl-10">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-teal">
                  For brands
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
                  Find creators worth the spend — screened first
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  Brief a campaign and budget, get a ranked shortlist matched on content fit
                  and reach, each one screened for engagement risk before you ever reach out.
                </p>
                <Link
                  href="/brands"
                  className="mt-6 inline-flex items-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-violet hover:text-violet focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
                >
                  Brief a campaign
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
