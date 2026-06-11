# Gap Analysis — CreatorPulse India

Current state of Indian creator-marketing tooling vs the target state CreatorPulse aims for, with the bridging actions that close each gap.

---

| # | Dimension | Current state (market) | Target state (CreatorPulse) | Gap | Bridging action |
|---|---|---|---|---|---|
| G1 | **Discovery** | Manual, spreadsheet- and follower-count-driven; 83% of marketers struggle to find suitable creators | Brief-to-shortlist in under a minute, fit-based ranking | Speed + fit | Embedding-based two-stage match engine over an indexed corpus (F16–F19) |
| G2 | **Quality screening** | Opaque or enterprise-only; brands sign on faith | Explainable engagement-risk indicator on every profile, affordably | Affordable, transparent screening | Heuristic-labelled risk model with SHAP signal reveal, honestly framed (F12–F14) |
| G3 | **Pricing access** | Enterprise tiers (~₹2.5L/yr entry) price out mid-market and creators | Free creator side + transparent low-cost brand side | Mid-market affordability | Freemium model on zero-marginal-cost stack (BRD §1, §3) |
| G4 | **Creator self-serve** | Creators have own-channel stats but no peer/niche/pricing context | Peer benchmark, niche forecast, sponsored-rate estimate | Supply-side analytics | Creator analytics suite (F22–F27) |
| G5 | **India specificity** | Global tools retrofitted; weak on regional niches/festivals | Indian niche taxonomy, archetypes, festival-aware forecasting | Localisation depth | 20-niche taxonomy + Prophet with Indian holiday calendar (F28) |
| G6 | **Transparency of ranking** | Black-box match scores erode trust | Visible score breakdown per result | Explainability | Score-component reveal in results + "why this match?" (F19) |
| G7 | **Earnings/pricing guidance** | No affordable, defensible rate guidance for creators or brands | Reach-based sponsored-video cost estimate, clearly disclosed | Defensible pricing signal | Pricing module surfacing a reach-based cost proxy (F21) |
| G8 | **Measurability** | Tools rarely expose product analytics back to the user's own decisions | Instrumented funnels, cohorts, defined North Star | Product-analytics rigour | PostHog dual-persona instrumentation + North Star (F29) |

---

## Gaps CreatorPulse deliberately does **not** close in v1

| Dimension | Why deferred |
|---|---|
| Multi-platform (Instagram, X) | Scoped to v2 to stay within documented API terms; abstract source interface keeps it additive |
| Campaign lifecycle (outreach, contracting, payments) | Out of v1 scope; incumbents own this — CreatorPulse competes on discovery + screening first |
| Platform-verified fraud | Not recoverable from public data; product reports risk, not verdicts |
| Audited creator income | Not recoverable from a single snapshot; product surfaces a reach-based cost proxy |

---

*Read: the highest-leverage gaps (G1–G3) are the wedge — fast fit-based discovery, affordable transparent screening, and mid-market pricing. Closing G4–G8 deepens the moat. The deferred gaps are roadmap, not v1, and are documented as such to keep the product's claims honest.*
