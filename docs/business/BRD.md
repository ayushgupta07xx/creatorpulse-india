# Business Requirements Document — CreatorPulse India

**Document owner:** Product · **Status:** Approved for build · **Version:** 1.0 · **Last updated:** 2026-06

---

## 1. Executive summary

CreatorPulse India is a creator-economy intelligence product for the Indian YouTube market. It serves two audiences from one platform: **creators**, who analyse their own channel growth, engagement quality and niche demand; and **brands and agencies**, who discover vetted creators for sponsorships and screen for engagement-quality risk before signing a contract.

The Indian influencer-marketing market is estimated at **₹3,400 crore in 2025** and growing at roughly **25% year-on-year** (EY; Kofluence; The Goat Agency / Kantar — see `market_sizing.md`). Despite that scale, brand-side discovery is still largely manual: **83% of marketers report difficulty identifying suitable creators**, and a material share of campaign spend is lost to inflated or low-quality engagement. Existing tooling that solves this (HypeAuditor and similar) is priced for enterprise budgets — HypeAuditor's entry tier is **$299/month billed annually (~₹2.5L/year)** — and is built for large brands and agencies, not for the long tail of mid-market D2C brands or for creators themselves.

CreatorPulse closes that gap with a **dual-persona, freemium-to-enterprise** model: free self-serve analytics for creators (top of funnel, supply side), and paid discovery + engagement-risk screening + brand-creator matching for brands and agencies (monetised, demand side). The platform indexes **12,547 Indian creators** today, with a daily/weekly refresh architecture that scales the universe further without exceeding free API quota.

This document defines the business requirements. Functional detail is in `FRD.md`; the market model is in `market_sizing.md`; the competitive position is in `competitive_analysis.md`; the five-year DCF, NPV/IRR and take-rate × adoption sensitivity are in `CreatorPulse_Executive_Workbook.xlsx`.

### The B2B pivot thesis

The creator side is **not** the revenue engine — it is the acquisition and data engine. Free creator analytics (a) build the indexed creator graph that powers brand-side matching, (b) generate the embeddings and engagement signals the match engine ranks on, and (c) create a defensible, India-specific data asset. Monetisation comes from the **brand side**: seat-based subscriptions for discovery and engagement-risk screening, priced well below incumbent enterprise tools to win mid-market D2C and independent agencies. This is the same supply-then-demand sequencing that underpins most successful two-sided marketplaces, applied to a market where the demand side is currently overpaying or going unserved.

---

## 2. Problem statement

Brands and agencies running influencer campaigns in India face three compounding problems:

1. **Discovery is manual and slow.** Marketers shortlist creators by hand from spreadsheets, agency rolodexes and follower counts. With 3.5–4.5 million Indian creators, manual discovery does not scale, and follower count is a poor proxy for fit or authenticity.
2. **Engagement quality is opaque.** A meaningful fraction of influencer spend is wasted on accounts with inflated or purchased engagement. Brands have no affordable, transparent way to screen for engagement-quality risk before committing budget.
3. **Affordable tooling does not exist for the mid-market.** The tools that do screen engagement quality are priced and packaged for enterprise. A D2C brand spending ₹40 lakh a quarter or an agency running 30 briefs a month cannot justify a ₹2.5L+/year enterprise contract, so they go without.

On the creator side, the problem is symmetric: independent and rising creators lack an affordable, India-aware view of how their channel is performing relative to peers, which niches are accelerating, and what a brand would reasonably pay for an integration.

---

## 3. Business objectives

| # | Objective | Measure of success |
|---|---|---|
| BO-1 | Make creator discovery fast and fit-based, not follower-based | Brand can go from a written brief to a ranked, screened shortlist in under one minute |
| BO-2 | Surface engagement-quality risk transparently and affordably | Every creator profile carries an explainable engagement-risk indicator derived from public signals |
| BO-3 | Win the under-served mid-market with transparent pricing | Brand-side plans priced materially below the incumbent enterprise entry tier (~₹2.5L/yr) |
| BO-4 | Build a defensible India-specific creator data asset | Indexed corpus of Indian creators refreshing on schedule within free API quota |
| BO-5 | Run the product on a zero-marginal-cost stack | Monthly infrastructure cost of ₹0 on free-tier hosting |
| BO-6 | Operate as a measurable product | Instrumented funnels, retention cohorts and a defined North Star metric from day one |

---

## 4. Scope

### In scope (v1)

- YouTube as the sole data source, via the **official YouTube Data API v3** (no scraping — see `LEGAL.md`).
- Dual-persona web application: creator analytics + brand discovery/matching.
- Engagement-quality **risk screening** (heuristic-labelled, explainable; not platform-verified fraud).
- Creator archetype clustering, niche-demand forecasting, and a reach-based sponsored-video cost estimate.
- Brand brief → ranked, screened shortlist with a transparent score breakdown.
- Product analytics (events, funnels, cohorts), one configured A/B experiment on match ranking.
- Analyst deliverables: BI dashboard, executive Excel workbook, and this BA package.

### Out of scope (v1 — future work)

- **Instagram, X, and other platforms.** Architecturally supported via an abstract creator-source interface, but not built in v1, to keep the product within documented API terms.
- Automated outreach, contracting, or payments to creators.
- Platform-verified fraud claims. CreatorPulse reports *risk on public signals*, never a verified-fraud verdict.
- Real campaign-performance attribution (requires conversion data CreatorPulse does not hold).

---

## 5. Stakeholders

| Stakeholder | Interest | Persona ref |
|---|---|---|
| Independent / rising creator | Understand own performance, peers, niche trend, fair sponsorship rate | Anjali (`personas.md`) |
| Mid-market D2C brand | Find fit creators fast, avoid wasted spend on low-quality engagement | Vikram (`personas.md`) |
| Agency campaign planner | Screen and shortlist at volume across many briefs | Sneha (`personas.md`) |
| Product / data owner | Defensible metrics, instrumented funnels, roadmap evidence | — |
| Compliance | API-terms compliance, honest framing of risk and earnings estimates | — |

---

## 6. Success criteria

- A brand brief produces a ranked, engagement-risk-screened shortlist of 20 creators with a visible score breakdown.
- Every creator profile shows a growth trend, a niche-demand forecast, an engagement-quality percentile within its archetype, and an explainable risk indicator.
- The indexed corpus refreshes on schedule within YouTube API free quota (daily tier-A, weekly tier-B rotation).
- The product runs at **₹0/month** on free-tier hosting after any optional cloud demo is torn down.
- Product analytics capture both persona funnels, four cohorts, and a defined North Star metric (weekly matched campaigns).
- Every business and metric claim traces to a committed artifact a reviewer can open; pre-launch metrics are labelled as validated against a simulated cohort.

---

## 7. Business risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Engagement-risk screening misread as verified fraud | Reputational / legal | Honest framing in UI and model card: "risk on public signals," never "verified fraud" |
| Earnings/cost estimate misread as actual creator income | Trust | UI and model card disclose it as a reach-based sponsored-video cost proxy, not income |
| YouTube API quota or terms change | Continuity | Tiered refresh with 4× headroom; abstract source interface; no scraping |
| Incumbents drop price into the mid-market | Competitive | India-specific archetypes + niche forecasting + free creator side as moat (see `competitive_analysis.md`) |
| Thin time-series history limits forecasting realism | Analytical | Forecasts and pre-launch experiment results labelled as simulated cohorts until organic history accrues |
| Single-snapshot data limits per-channel earnings recovery | Analytical | OLS earnings retained as a methodology artifact; product surfaces a reach-based cost proxy instead |

---

*Continued in `FRD.md` (functional and non-functional requirements), `market_sizing.md`, `competitive_analysis.md`, `swot.md`, `pestle.md`, and `gap_analysis.md`.*
