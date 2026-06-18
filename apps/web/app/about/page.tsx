import AuroraBackground from "@/components/AuroraBackground";
import Reveal from "@/components/Reveal";
import StatStrip from "@/components/StatStrip";

const GITHUB = "https://github.com/ayushgupta07xx";
const LINKEDIN = "https://www.linkedin.com/in/ayushgupta07xx"; // TODO: confirm/replace

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-wrap px-6 pb-12 pt-16">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
              About
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              An honest read on India&apos;s creators
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted">
              CreatorPulse indexes thousands of Indian YouTube creators from the
              official YouTube Data API and layers growth, niche-demand
              forecasting, behavioral clustering, and an engagement-risk model on
              top — so creators understand their standing and brands shortlist
              with eyes open. It runs on a free, open stack and is built and
              maintained by{" "}
              <span className="font-semibold text-ink">Ayush Gupta</span>.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-wrap px-6 pb-20">
        <Reveal>
          <StatStrip />
        </Reveal>

        {/* Drop a product walkthrough clip here: put demo.mp4 in /public and
            swap this slot for a <video autoPlay muted loop playsInline>. */}
        <Reveal delay={0.06}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
            <div className="shimmer flex aspect-video items-center justify-center">
              <span className="font-mono text-sm text-muted">
                demo walkthrough — drop /public/demo.mp4 here
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-ink transition-colors hover:border-violet focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
            <a
              href={LINKEDIN}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-ink transition-colors hover:border-violet focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M13.6 0H2.4A2.4 2.4 0 000 2.4v11.2A2.4 2.4 0 002.4 16h11.2a2.4 2.4 0 002.4-2.4V2.4A2.4 2.4 0 0013.6 0zM4.8 13.6H2.4V6h2.4v7.6zM3.6 4.9a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8zm10 8.7h-2.4V9.9c0-.9-.02-2-1.22-2-1.22 0-1.41.96-1.41 1.94v3.76H6.17V6h2.3v1.04h.03c.32-.6 1.1-1.23 2.27-1.23 2.43 0 2.88 1.6 2.88 3.68v4.11z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
