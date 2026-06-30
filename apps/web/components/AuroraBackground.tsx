"use client";

import { useEffect, useRef } from "react";

// Drifting aurora + a cursor-following spotlight behind the hero. Pointer is
// tracked on window (the layer itself is non-interactive) so the glow follows
// even over the hero content above it. Reduced-motion: the CSS guards stop
// the drift and hide the spotlight.
export default function AuroraBackground({ extended = false }: { extended?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none overflow-hidden ${
        extended ? "fixed inset-0 -z-10" : "absolute inset-0"
      }`}
    >
      <div className="aurora-blob aurora-b1" />
      <div className="aurora-blob aurora-b2" />
      <div className="aurora-blob aurora-b3" />
      <div className="aurora-blob aurora-b4" />
      {extended && <div className="aurora-veil" />}
      <div className="aurora-spot" />
    </div>
  );
}
