# Wireframes — CreatorPulse India

Low-fidelity wireframes for the dual-persona UX are maintained in Figma.

> **Figma link:** `<PASTE PUBLIC FIGMA LINK HERE>`
> Set the Figma file's share setting to *Anyone with the link → can view* before pasting, and verify the link in an incognito window (logged-out view ≠ owner view).

The screen inventory below is the source of truth for what the Figma file must contain; it doubles as the wireframe spec so the doc is useful even before the link is live. Each screen maps to functional requirements in `FRD.md` and user stories in `user_stories.md`.

---

## Shared

- **W0 — Landing / persona select.** Two clear entry points: "I'm a creator" and "I'm a brand." Fires `persona_selected`. (F29)

## Creator persona

- **W1 — Channel search.** Search box with name autocomplete; empty and "not indexed" states. (F22 · CS-1)
- **W2 — Creator profile.** Header (thumbnail, subs, views, archetype badge, avg views/video); growth curve with forward projection; engagement-quality card with in-archetype percentile; niche-demand forecast with interval bands; peer-benchmark table; rule-based optimisation tips. (F22–F27 · CS-2…CS-6)

## Brand persona

- **W3 — Brief composer.** Free-text brief, niche selector, budget input, "Find creators" CTA. (F16 · BR-1)
- **W4 — Ranked results.** Top-20 list; each row shows match score, engagement-risk indicator, estimated sponsored-video cost; "why this match?" expands the score breakdown and top risk signals. (F17–F21 · BR-2, BR-3, BR-4)
- **W5 — Shortlist & compare.** Add up to 5 creators; side-by-side comparison; CSV export. (F20, F30 · BR-5, BR-6)

---

## Wireframe conventions

- Low-fidelity (greyscale boxes + labels), not high-fidelity mockups — intent is layout and flow, not visual design.
- Annotate each interactive element with the event it fires, to keep wireframes and the analytics taxonomy in sync.
- Brand system (for any higher-fidelity follow-up): Petrol accent `#3E6668` / `#2D4D4F`, Manrope/Inter/JetBrains Mono type stack. Reserve red/green strictly for the single engagement-risk meaning — no other red/green in the UI.

---

*Once the Figma link is pasted and verified incognito, tick the wireframes item in the project success criteria.*
