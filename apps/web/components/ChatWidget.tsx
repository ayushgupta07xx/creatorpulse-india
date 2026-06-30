"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chat, sendFeedback, type ChatMessage } from "@/lib/api";
import { usePathname } from "next/navigation";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can explain how CreatorPulse works, what the numbers mean, and where they fall short. Ask me anything about the product.",
};

const SUGGESTIONS = [
  "How does brand–creator matching work?",
  "Is the engagement risk real fraud detection?",
  "How is sponsor cost estimated?",
];

// posthog is loaded globally (window.posthog) by the app shell; this is a no-op if absent.
// NOTE: a silent no-op means "button clicked" does NOT prove "event landed" — verify at the
// PostHog live feed + the isolated CLI smoke (scripts/posthog_smoke.py), never app-appears-to-work.
function track(event: string, props?: Record<string, unknown>) {
  try {
    (
      window as unknown as {
        posthog?: { capture?: (e: string, p?: Record<string, unknown>) => void };
      }
    ).posthog?.capture?.(event, props);
  } catch {
    /* posthog is optional — no-op if absent */
  }
}

// Compact markdown renderers tuned for the dark chat bubble (no @tailwindcss/typography needed).
const MD = {
  p: (p: ComponentPropsWithoutRef<"p">) => <p className="mb-2 last:mb-0" {...p} />,
  ul: (p: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0" {...p} />
  ),
  ol: (p: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0" {...p} />
  ),
  li: (p: ComponentPropsWithoutRef<"li">) => <li className="leading-snug" {...p} />,
  strong: (p: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-ink" {...p} />
  ),
  em: (p: ComponentPropsWithoutRef<"em">) => <em className="italic" {...p} />,
  a: (p: ComponentPropsWithoutRef<"a">) => (
    <a className="text-violet underline" target="_blank" rel="noreferrer" {...p} />
  ),
  code: (p: ComponentPropsWithoutRef<"code">) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs" {...p} />
  ),
};

function chatContext(pathname: string | null): Record<string, string> | undefined {
  if (!pathname) return undefined;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "creators") {
    return { page: "creator", channel_id: decodeURIComponent(parts[1]) };
  }
  return undefined;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Client-side progressive reveal of the (already-buffered) assistant reply.
  // The server stays a single round-trip returning {reply}; this only animates display.
  const [stream, setStream] = useState<{ idx: number; shown: number } | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const [chatSize, setChatSize] = useState({ w: 352, h: 512 });
  const [infoOpen, setInfoOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  // Launcher hint: nudge visitors toward the assistant. ChatWidget is mounted
  // once in the global layout, so this effect runs on each page load / refresh /
  // new tab, but NOT on client-side navigation between tabs (no remount).
  useEffect(() => {
    setHintOpen(true);
    const t = setTimeout(() => setHintOpen(false), 5000);
    return () => clearTimeout(t);
  }, []);
  // External trigger: other parts of the app (e.g. the creators empty state)
  // can ask the assistant a question via a window event. Opens, prefills, sends.
  useEffect(() => {
    function onAsk(e: Event) {
      const q = (e as CustomEvent<{ q?: string }>).detail?.q;
      if (!q) return;
      setOpen(true);
      setInput(q);
      void send(q);
    }
    window.addEventListener("creatorpulse:ask", onAsk as EventListener);
    return () => window.removeEventListener("creatorpulse:ask", onAsk as EventListener);
    // send is stable enough for this fire-and-forget trigger; deps intentionally bare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const startResize = (e: ReactPointerEvent) => {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const sw = chatSize.w;
    const sh = chatSize.h;
    const onMove = (ev: PointerEvent) => {
      // panel is anchored bottom-right; dragging the bottom-left grip grows w/h
      const w = Math.min(Math.max(sw + (sx - ev.clientX), 320), window.innerWidth - 40);
      const h = Math.min(Math.max(sh + (ev.clientY - sy), 360), window.innerHeight - 112);
      setChatSize({ w, h });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const distinctId = useRef<string>("");
  useEffect(() => {
    // Stable anonymous id per browser, so feedback rows aren't all one person.
    try {
      let id = localStorage.getItem("cp_distinct_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("cp_distinct_id", id);
      }
      distinctId.current = id;
    } catch {
      distinctId.current = "web-anon";
    }
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open, stream]);

  // Drive the typewriter reveal: bump `shown` until it reaches the full reply length.
  useEffect(() => {
    if (!stream) return;
    const full = messages[stream.idx]?.content ?? "";
    if (stream.shown >= full.length) {
      setStream(null);
      return;
    }
    const step = Math.max(2, Math.ceil(full.length / 120)); // ~120 ticks regardless of length
    const id = setTimeout(() => {
      setStream((s) => (s ? { ...s, shown: Math.min(full.length, s.shown + step) } : s));
    }, 24);
    return () => clearTimeout(id);
  }, [stream, messages]);

  function rate(i: number, rating: "up" | "down") {
    if (feedback[i]) return;
    setFeedback((f) => ({ ...f, [i]: rating }));
    void sendFeedback(rating, pathname ?? "unknown", distinctId.current || "web-anon").catch(
      () => {
        /* feedback is best-effort — never surface an error for a thumb click */
      },
    );
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setError("");
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    track("chat_message_sent");
    try {
      // drop the canned greeting; send only real turns (ends with the user's question)
      const history = next.filter((m, i) => !(i === 0 && m === GREETING));
      const { reply } = await chat(history, chatContext(pathname));
      const assistantIdx = next.length; // assistant message lands at this index
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!reduceMotion && reply.length > 0) {
        setStream({ idx: assistantIdx, shown: 0 });
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("429")
          ? "I'm getting a lot of questions right now — try again in a moment."
          : "Sorry, I couldn't reach the assistant just now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {hintOpen && !open && (
        <div className="fixed bottom-7 right-24 z-50 flex items-center" role="status">
          <button
            type="button"
            onClick={() => setHintOpen(false)}
            className="relative rounded-xl bg-gradient-to-br from-violet to-teal px-3.5 py-2 text-sm font-semibold text-bg shadow-lg shadow-violet/25 transition-transform hover:scale-[1.02]"
          >
            Questions? Ask the assistant
            <span
              className="absolute right-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-teal"
              aria-hidden
            />
          </button>
        </div>
      )}
      <button
        onClick={() => {
          setHintOpen(false);
          setOpen((o) => !o);
          if (!open) track("chat_opened");
        }}
        aria-label={open ? "Close assistant" : "Ask the CreatorPulse assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal text-bg shadow-lg shadow-violet/20 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9 8.38 8.38 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            width: chatSize.w,
            height: chatSize.h,
            background: "linear-gradient(160deg, #1c1630 0%, #13202a 55%, #0e0d16 100%)",
          }}
          className="fixed bottom-24 right-5 z-50 flex max-h-[calc(100vh-7rem)] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl ring-1 ring-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_24px_60px_-20px_rgba(0,0,0,0.9)]"
        >
          <div
            onPointerDown={startResize}
            title="Drag to resize"
            aria-label="Resize chat"
            className="absolute bottom-1 left-1 z-20 h-4 w-4 cursor-nesw-resize opacity-50 hover:opacity-90"
            style={{
              background:
                "linear-gradient(45deg, transparent 55%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.5) 65%, transparent 65%, transparent 78%, rgba(255,255,255,0.5) 78%, rgba(255,255,255,0.5) 88%, transparent 88%)",
            }}
          />
          <div
            onMouseEnter={() => setInfoOpen(true)}
            onMouseLeave={() => setInfoOpen(false)}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <p className="font-display text-sm font-bold text-ink">CreatorPulse assistant</p>
              <span
                aria-label="What can the assistant answer?"
                className="flex h-5 w-5 cursor-help items-center justify-center rounded-full text-[11px] font-semibold text-violet ring-1 ring-violet/40 transition-colors hover:bg-violet/15 hover:text-ink"
              >
                ?
              </span>
            </div>
            {infoOpen && (
              <div className="absolute inset-x-0 top-[3.25rem] bottom-0 z-30 overflow-y-auto bg-[#13121d] px-5 py-4">
                <p className="font-display text-sm font-bold text-ink">What I can help with</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal">Can answer</p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted">
                  <li>Any indexed creator&apos;s stats — subscribers, typical &amp; average views, niche, archetype, engagement-risk, estimated sponsor cost.</li>
                  <li>Compare two creators on those metrics.</li>
                  <li>Match a campaign brief to a ranked creator shortlist.</li>
                  <li>Which niches are rising or cooling.</li>
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-violet">Can&apos;t answer</p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted">
                  <li>Real earnings — only a reach-based cost <em>estimate</em>, not actual income.</li>
                  <li>Instagram or other platforms — YouTube only.</li>
                  <li>Fraud verdicts — engagement risk is a heuristic signal, not an accusation.</li>
                  <li>Per-channel history — one snapshot; only niche demand is forecast (simulated).</li>
                  <li>Channels outside the ~12,500 indexed.</li>
                <li>Cost or risk for channels with fewer than 10 videos (insufficient history).</li>
                </ul>
              </div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const isStreaming = stream?.idx === i;
              const shownText = isStreaming ? m.content.slice(0, stream.shown) : m.content;
              const showFeedback = !isUser && i > 0 && !isStreaming;
              return (
                <div key={i} className={isUser ? "flex justify-end" : "flex flex-col items-start"}>
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-violet/20 px-3 py-2 text-sm text-ink"
                        : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.04] px-3 py-2 text-sm text-ink ring-1 ring-white/[0.06]"
                    }
                  >
                    {isUser ? (
                      m.content
                    ) : isStreaming ? (
                      <span className="whitespace-pre-wrap">
                        {shownText}
                        <span className="ml-0.5 animate-pulse text-muted">▍</span>
                      </span>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                        {shownText}
                      </ReactMarkdown>
                    )}
                  </div>
                  {showFeedback && (
                    <div className="mt-1 flex gap-1 pl-1">
                      <button
                        onClick={() => rate(i, "up")}
                        disabled={!!feedback[i]}
                        aria-label="Helpful"
                        className={
                          feedback[i] === "up"
                            ? "text-violet"
                            : "text-muted transition-colors hover:text-ink disabled:opacity-40"
                        }
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 10v12" />
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => rate(i, "down")}
                        disabled={!!feedback[i]}
                        aria-label="Not helpful"
                        className={
                          feedback[i] === "down"
                            ? "text-risk-high"
                            : "text-muted transition-colors hover:text-ink disabled:opacity-40"
                        }
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 14V2" />
                          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white/[0.04] px-3 py-2 text-sm text-muted ring-1 ring-white/[0.06]">…thinking</div>
              </div>
            )}
            {error && <p className="text-xs text-risk-high">{error}</p>}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-lg bg-white/[0.03] px-3 py-2 text-left text-xs text-muted ring-1 ring-white/[0.07] transition-colors hover:text-ink hover:ring-violet/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask about CreatorPulse…"
                className="max-h-24 flex-1 resize-none rounded-lg bg-black/30 px-3 py-2 text-sm text-ink ring-1 ring-white/10 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-violet/60"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-bg transition-opacity disabled:opacity-40"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
