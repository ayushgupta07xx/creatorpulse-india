"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function InfoHint({
  children,
  label = "More info",
  placement = "bottom",
}: {
  children: ReactNode;
  label?: string;
  placement?: "bottom" | "bottom-right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pos =
    placement === "left"
      ? "right-full top-0 mr-2"
      : placement === "bottom-right"
        ? "right-0 top-full mt-2"
        : "left-0 top-full mt-2";

  return (
    <span
      ref={ref}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-muted ring-1 ring-white/15 transition-colors hover:text-ink hover:ring-white/30"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-30 block w-64 rounded-xl bg-gradient-to-b from-surface2 to-surface p-3 text-xs font-normal leading-relaxed text-muted ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_12px_30px_-12px_rgba(0,0,0,0.9)] ${pos}`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
