"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EmptyState, { AlertIcon, SearchOffIcon } from "@/components/EmptyState";
import SkeletonGrid from "@/components/SkeletonGrid";
import Link from "next/link";
import { searchCreators, type CreatorSummary } from "@/lib/api";
import CreatorCard from "@/components/CreatorCard";
import Reveal from "@/components/Reveal";
import AuroraBackground from "@/components/AuroraBackground";
import InfoHint from "@/components/InfoHint";

const PLACEHOLDER_NAMES = [
  "CarryMinati", "BB Ki Vines", "Technical Guruji", "ashish chanchlani vines",
  "Mythpat", "Triggered Insaan", "Harsh Beniwal", "Flying Beast",
  "Mumbiker Nikhil", "Sandeep Maheshwari", "Gaurav Chaudhary", "Round2hell",
  "Amit Bhadana", "Elvish yadav", "Fukra Insaan", "Slayy Point",
  "Tanmay Bhat", "Samay Raina", "Kabita's Kitchen", "Sanjeev Kapoor Khazana",
  "Your Food Lab", "Dolly Singh", "Ranveer Allahbadia", "Abhi and Niyu",
  "Zakir Khan", "Aakash Gupta", "BeerBiceps", "Krish Naik",
  "CodeWithHarry", "wifistudy 2.0 by Unacademy",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; results: CreatorSummary[] }
  | { kind: "error"; message: string };

export default function CreatorsPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const names = useMemo(() => {
    const a = [...PLACEHOLDER_NAMES];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);
  const [phIdx, setPhIdx] = useState(0);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    if (q || reduced.current) return;
    const id = setInterval(() => setPhIdx((i) => (i + 1) % names.length), 1500);
    return () => clearInterval(id);
  }, [q, names.length]);

  async function run(initial?: string) {
    const term = (initial ?? q).trim();
    if (!term) return;
    setState({ kind: "loading" });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?q=${encodeURIComponent(term)}`,
    );
    try {
      const results = await searchCreators(term, 24);
      setState({ kind: "done", results });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Search failed",
      });
    }
  }

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQ(initial);
      run(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AuroraBackground extended />
      <div className="mx-auto max-w-wrap px-6 py-12">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Search creators
          </h1>
          <InfoHint label="About creator search" placement="left">
            Type a channel name. Each result shows reach, an estimated sponsored cost, and an
            engagement-risk read.
          </InfoHint>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="mt-8 flex gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder={`e.g. ${names[phIdx]}`}
            aria-label="Creator name"
            className="w-full rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-ink placeholder:text-muted focus:border-violet focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
          />
          <button
            onClick={() => run()}
            className="btn-sheen shrink-0 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
          >
            Search
          </button>
        </div>
      </Reveal>

      <div className="mt-10">
        {state.kind === "loading" && <SkeletonGrid variant="creator" count={6} />}

        {state.kind === "error" && (
          <EmptyState
            tone="error"
            icon={<AlertIcon />}
            title="Couldn't reach the search service"
            body={`${state.message}. Try again in a moment.`}
          />
        )}

        {state.kind === "done" && state.results.length === 0 && (
          <EmptyState
            icon={<SearchOffIcon />}
            title={`No match for “${q.trim()}”`}
            body={
              <>
                The catalogue is a fixed set of Indian creators, so not every channel is covered —
                try another name.{" "}
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("creatorpulse:ask", {
                        detail: { q: `Why is “${q.trim()}” not in the database?` },
                      }),
                    )
                  }
                  className="font-medium text-teal underline-offset-2 transition-colors hover:text-violet hover:underline"
                >
                  Learn more
                </button>
              </>
            }
          />
        )}

        {state.kind === "done" && state.results.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.results.map((c, i) => (
              <Reveal key={c.channel_id} delay={Math.min(i * 0.04, 0.4)}>
                <Link href={`/creators/${c.channel_id}`} className="block">
                  <CreatorCard c={c} />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
