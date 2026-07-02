# Retrospective — CreatorPulse India

A dual-persona creator-economy intelligence product for the Indian YouTube market: creators
analyze their own channel; brands find and screen creators for campaigns. Built free-forever on
an OSS + free-tier stack.

## What shipped

- **Warehouse**: dbt on PostgreSQL over **12,547** channels (Kaggle-seeded IDs, live YouTube
  Data API v3 stats) — staging + marts (`dim_channel` SCD2, `fact_video`, feature/embedding
  marts, niche-demand mart).
- **ML/analytics**: XGBoost engagement-fraud classifier (SHAP), K-means (k=8) + DBSCAN →
  **6 archetypes**, sentence-transformers semantic match over pgvector, earnings regressor with
  reach-first `cost_basis`-labeled pricing, Prophet forecasts over **20 niches**.
- **API**: FastAPI on HF Spaces — `/creators`, `/match`, `/chat` (Groq grounded assistant),
  `/feedback`, `/stats`; Neon + Upstash.
- **Frontends**: Next.js on Vercel (primary UI) and Streamlit on Community Cloud (dual-persona
  analyst app), both incognito-verified.
- **Analytics**: PostHog — 12 events, dual funnels, retention cohorts, one A/B feature flag;
  server-side `chat_feedback` confirmed landing at the provider.
- **BA/BI package**: BRD, FRD, user stories, personas, BPMN, SWOT, PESTLE, gap analysis,
  competitive teardown, market sizing, Figma wireframes; Power BI `.pbix` (+ screenshots),
  11-sheet Excel workbook with DCF/NPV/IRR, named ranges, and inserted PivotTables.

## What worked

- **API-as-single-service.** Making the FastAPI service the one match engine let both frontends
  stay thin. Refactoring Streamlit's brand match to call `/match` (rather than loading torch
  in-process) removed the only real memory risk and made the Cloud deploy trivial (ADR-0037).
- **`cost_basis` labeling.** Surfacing *how* each sponsored-cost figure was derived
  (base/range/cap/insufficient/unverified) turned a fragile point estimate into a legible,
  defensible number, and the min-video guard kept one-viral-upload channels out of rankings.
- **Deterministic guardrails on the LLM.** The templated missing-channel handler (ADR-0036)
  removed the highest-risk hallucination paths without a heavier RAG layer.
- **Claims-integrity discipline.** Every metric traces to a live artifact; pre-launch A/B and
  silhouette figures are labeled "validated against a simulated cohort," not implied as organic.

## What was hard

- **Cloud DB reality.** A cloud-hosted app can't reach a local Docker Postgres. The Streamlit
  deploy surfaced this repeatedly: it needed Neon, and one query joined `staging.videos` (never
  migrated) — fixed by migrating a lean `marts.video_titles` lookup rather than the full table.
- **Torch-free but not dependency-free.** Dropping torch wasn't enough — the joblib cluster
  bundle still needed `scikit-learn`/`scipy` to unpickle (KMeans/PCA/StandardScaler). A clean-env
  test must *load the bundle*, not just import the module.
- **Streamlit Cloud cache across redeploys.** `@st.cache_data` survived a redeploy and served a
  stale cached *exception* after a fixed query — resolved only by **rebooting** the app, not a
  code push.
- **Build-time env baking.** Vercel `NEXT_PUBLIC_*` and the Space contract both bake at build;
  a missing var reads as a working-looking site that can't reach the API. Verified by grepping
  the live JS bundle, not the dashboard.

## Honest limitations

- **No organic traffic.** All funnel/cohort/A-B numbers are simulated-cohort results, labeled as
  such. The A/B feature flag is configured but the experiment is unlaunched.
- **Point-in-time corpus.** The 12,547-channel snapshot is not continuously refreshed; some
  large/new creators are absent (the assistant says so deterministically rather than guessing).
- **Pricing is an estimate.** Sponsored-cost figures are reach-based model estimates, not
  platform-verified rate cards — surfaced with that caveat on every cost.
- **BI on an extract.** The Power BI `.pbix` is built on a representative extract, not all 12,547
  rows loaded into the file; the "12,547" figure is the warehouse count, stated as such.

## If continued

Live refresh on a schedule (Airflow DAG already patterned); launch the A/B once there's traffic;
mobile/responsive pass on both frontends; Instagram as the v2 source the architecture already
anticipates.
