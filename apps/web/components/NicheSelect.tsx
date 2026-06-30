"use client";

import { useEffect, useRef, useState } from "react";

// Custom dark dropdown replacing the native <select> (whose OS popup can't be
// reliably themed on Windows). Controlled via value/onChange; "" = "Any niche".
export default function NicheSelect({
  value,
  onChange,
  options,
  buttonClassName = "",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  buttonClassName?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

  const items = ["", ...options];
  const label = value || "Any niche";

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${buttonClassName} flex cursor-pointer items-center justify-between gap-2`}
      >
        <span className={value ? "text-ink" : "text-muted"}>{label}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 bottom-full z-40 mb-2 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-surface2 p-1 shadow-[0_-18px_40px_-16px_rgba(0,0,0,0.9)] ring-1 ring-black/20"
        >
          {items.map((opt) => {
            const selected = opt === value;
            return (
              <li key={opt || "any"} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => pick(opt)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-teal/10 text-teal"
                      : "text-ink hover:bg-white/[0.06]"
                  }`}
                >
                  {opt || "Any niche"}
                  {selected && (
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="m4 10 4 4 8-9" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
