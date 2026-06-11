# Functional Requirements Document — CreatorPulse India

**Document owner:** Product · **Status:** Approved for build · **Version:** 1.0
**Companion to:** `BRD.md` · **Functional detail referenced by:** `user_stories.md`, `process_maps.md`

Priority key: **M** = must-have (v1), **S** = should-have (v1 if time permits), **C** = could-have (v2).

---

## A. Data ingestion & warehouse

| ID | Requirement | Priority |
|---|---|---|
| F1 | The system shall ingest channel and video data exclusively via the official YouTube Data API v3. | M |
| F2 | The system shall maintain a curated seed list of Indian creator channels and validate channel IDs against the API. | M |
| F3 | The system shall refresh the top tier of creators (by subscribers) daily and the long tail on a weekly rotation, staying within free API quota. | M |
| F4 | The system shall track a metrics time series per channel (subscribers, total views, video count) to enable growth-velocity analysis. | M |
| F5 | The system shall persist raw API responses to object storage for reprocessing. | S |
| F6 | The system shall transform raw data into a dimensional warehouse (staging → intermediate → marts) with a star schema. | M |
| F7 | The system shall maintain an SCD Type 2 snapshot on the channel dimension to track subscriber and name changes over time. | M |
| F8 | The system shall enforce data-quality tests (uniqueness, not-null, referential integrity, accepted ranges) on warehouse models. | M |
| F9 | The system shall expose a daily API-quota-usage metric for operational monitoring. | S |

## B. Creator embeddings, clustering & risk screening

| ID | Requirement | Priority |
|---|---|---|
| F10 | The system shall compute a content embedding per creator from channel title, description and top video titles, stored in a vector store. | M |
| F11 | The system shall cluster creators into 8 archetypes and report a silhouette score; clusters are behavioural and labelled accordingly. | M |
| F12 | The system shall compute engagement-quality features per creator (engagement-rate distribution, comment ratios, growth-velocity anomalies, posting cadence, country consistency). | M |
| F13 | The system shall produce an explainable engagement-quality **risk indicator** per creator, with the top contributing signals shown. | M |
| F14 | The system shall present the risk indicator as risk-on-public-signals, never as platform-verified fraud, in every UI surface and the model card. | M |
| F15 | The system shall version models and log training runs to an experiment tracker. | S |

## C. Brand-creator match engine

| ID | Requirement | Priority |
|---|---|---|
| F16 | The system shall accept a free-text brand brief plus a niche selector and a budget input. | M |
| F17 | The system shall generate candidate creators by embedding-similarity against the brief (Stage 1). | M |
| F18 | The system shall optionally re-rank candidates by a composite of similarity, niche overlap, engagement-risk penalty and budget fit (Stage 2). | M |
| F19 | The system shall return the top 20 matches, each with a visible score breakdown so the user sees *why* a creator ranked where it did. | M |
| F20 | The system shall let a brand add up to 5 creators to a shortlist and view them side by side; shortlists persist per session. | M |
| F21 | The system shall display a reach-based sponsored-video cost estimate per creator, disclosed as an estimate, not actual income. | M |

## D. Creator analytics

| ID | Requirement | Priority |
|---|---|---|
| F22 | The system shall let a creator search their channel by name and view a profile with subscribers, views, niche/archetype badge and average views per video. | M |
| F23 | The system shall display a growth curve with a forward projection. | M |
| F24 | The system shall display an engagement-quality score with the creator's percentile within their archetype. | M |
| F25 | The system shall display a niche-demand forecast with credible-interval bands. | M |
| F26 | The system shall display a peer-benchmark table of the closest creators in the same archetype. | S |
| F27 | The system shall provide rule-based optimisation suggestions (e.g. posting cadence vs cluster median). | S |

## E. Forecasting, analytics & export

| ID | Requirement | Priority |
|---|---|---|
| F28 | The system shall produce 12-week niche-demand forecasts for all 20 taxonomy niches using a holiday calendar of Indian regional festivals. | M |
| F29 | The system shall instrument both persona funnels (events, funnels, cohorts) and expose a defined North Star metric (weekly matched campaigns). | M |
| F30 | The system shall allow export of dashboard/shortlist data (CSV) and provide committed BI artifacts (Power BI .pbix, Looker Studio link, Excel workbook). | M |

---

## Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | A match request shall return ranked results within a few seconds on the free-tier deployment; cold start is acceptable and documented. |
| NFR-2 | Accuracy (targets) | Engagement-risk classifier F1 ≥ 0.75 on its labelled set; earnings methodology R² ≥ 0.65; archetype silhouette reported honestly (real corpus did not clear the 0.35 target at scale — see Canonical Numbers in the project doc). |
| NFR-3 | Cost | Production deployment shall run at ₹0/month on free-tier hosting; any cloud demo is torn down immediately after screenshots. |
| NFR-4 | Compliance | Data acquisition shall use only the official API in accordance with its terms; no scraping; `LEGAL.md` present and accurate. |
| NFR-5 | Transparency | Risk indicators and earnings/cost estimates shall carry honest-framing disclosures; pre-launch metrics shall be labelled as validated against a simulated cohort. |
| NFR-6 | Reliability | Scheduled refreshes shall be idempotent and quota-aware; failures shall not corrupt the warehouse. |
| NFR-7 | Privacy | The product shall surface only public creator data and shall not attempt to identify or profile private individuals. |
| NFR-8 | Maintainability | Code shall pass the repo lint/type/test gates (ruff, mypy, sqlfluff, pytest) and a model-eval gate (F1 regression < 5%) in CI. |

---

*Acceptance criteria per feature are captured at the user-story level in `user_stories.md`. Process flows for the headline journeys are in `process_maps.md`.*
