# Model Card — CreatorPulse

CreatorPulse is creator-economy intelligence for the Indian YouTube market: it indexes
creators, screens engagement quality, clusters behavioural archetypes, forecasts niche
demand, and matches brands to creators. This card documents every model the product
ships, how each was trained and evaluated, and — prominently — what it does **not** do.

**Honesty up front.** CreatorPulse is a *risk-screening and intelligence* tool built on
public data, not an auditing authority. Fraud labels are heuristic, not platform-verified.
Earnings figures are reach-based estimates, not observed income. Metrics marked
**SIMULATED** were validated against a simulated cohort because the product is pre-launch
and has no organic traffic; they are not claims of real-world performance.

- **Owner / maintainer:** Ayush Gupta — [GitHub](https://github.com/ayushgupta07xx) · API: `ayushgupta7777/creatorpulse-api` (Hugging Face Spaces)
- **Domain:** Indian YouTube creator economy
- **Last updated:** 2026-06 (data snapshot 2026-06-09)

---

## 1. Data

| | |
|---|---|
| Source | YouTube Data API v3 (official) — the only data source |
| Seed list | Kaggle channel list (ODC-By; attribution in `LEGAL.md`) |
| Scope | 12,547 Indian creator channels · 124,527 videos (124,525 after 2 dead-ID orphans filtered at staging) |
| Snapshot | **Single** metrics snapshot (2026-06-09) |
| Warehouse | dbt over PostgreSQL — 21 models (3 staging / 10 intermediate / 8 marts) + 1 SCD-Type-2 snapshot on `dim_channel`, 65 tests passing |

The single-snapshot nature is the most important data limitation: there is **no time
history**, so growth and demand features are short-window fits or modeled, not measured
trends (see §7). No scraping is used; collection respects YouTube ToS (`LEGAL.md`).

---

## 2. Intended use

**In scope.** Discovering and shortlisting Indian creators for brand campaigns; screening
for engagement-quality risk; understanding niche demand direction; estimating
sponsored-campaign cost ranges; exploratory creator-economy analytics.

**Out of scope.** Verifying fraud or bot activity as fact; reporting a creator's actual
income; financial, legal, or contractual decisions; any use outside Indian YouTube; any
claim of platform-verified accuracy. Model outputs are decision *support*, not ground truth.

---

## 3. Engagement-fraud classifier  · **LIVE**

XGBoost classifier returning P(suspicious) per channel, surfaced in the UI as a risk badge
with the top-3 SHAP signals.

- **Training data:** a **simulated 200-creator cohort**, calibrated from the real feature
  distributions. Ground-truth labels are assigned by a heuristic rule set (≥3 of the
  following fire → suspicious): daily-spike + week-over-week-growth-std combination;
  engagement skew; very low comment-to-like ratio; declared-vs-actual country mismatch;
  engagement-rate Gini concentration; (deferred — no commenter data) bot-username share.
  The model learns to predict the label from feature combinations, not to re-fire the rules.
- **Performance (on the simulated cohort):** 5-fold CV **F1 = 0.83** (held-out 0.72,
  AUC 0.78, precision 0.75 / recall 0.69). Baselines: LightGBM 0.67, IsolationForest 0.52.
- **Tuning / tracking:** Optuna (50 trials, F1 objective); SHAP explanations; MLflow runs.
- **Inference:** genuine feature extraction over all 12,547 live channels. Growth and
  country-fit features are NULL on real single-snapshot data and do not drive live scores.
- **CI gate:** `evaluation/baselines/fraud_classifier.json` stores baseline F1/AUC; CI
  retrains per PR and blocks a merge if F1 regresses > 5%.

**Limitation.** Heuristic labels are a *proxy* for suspicious engagement, not verified
fraud. A high score means "worth a closer look before signing," never "this is a fraudster."

---

## 4. Behavioural archetype clustering  · **LIVE (real) + SIMULATED (target)**

K-means (k=8) with a DBSCAN secondary analysis over the full 12,547-channel corpus, on
384-dim BGE-small content embeddings stored in `marts.channel_embeddings` (pgvector).

- **Real performance:** composite (content + behavioural) silhouette **0.203**;
  content-only embeddings are undifferentiated (≈ −0.03) and DBSCAN collapses to 1 cluster
  + 6 noise points. 6 of 8 archetype labels are distinct under lift-based labelling. The
  real silhouette **did not clear the 0.35 target** at corpus scale.
- **SIMULATED:** on a 320-creator simulated cohort with injected archetype ground truth,
  silhouette **0.48** / ARI **1.0**. This is the *sole* basis for any "silhouette > 0.4"
  statement and is labelled as such everywhere it appears.

**Limitation.** Because separation is behavioural, a channel's assigned archetype is a
**cohort label that may not match its own content niche** — archetype and niche are
orthogonal and should not be read as the same thing.

---

## 5. Earnings estimator  · **methodology artifact only**

OLS (statsmodels) predicting an AdSense-equivalent figure.

- **Performance (simulated 1,000-creator cohort):** 5-fold CV **R² = 0.67** (held-out 0.62,
  train 0.70), with Q-Q and residuals-vs-fitted diagnostics; `earnings_regressor_v1.joblib`.
- **Status:** retained as a *methodology* artifact. Per-channel monthly AdSense is **not
  recoverable** from a single snapshot plus a ~10-video sample, and the top OLS estimate
  reads low for dormant channels. The product therefore does **not** display this as income.

Instead, brand/creator pages show a transparent **sponsored-video cost proxy**
(`apps/ml/pricing.py`: `mean_views × niche_CPM × 20 / 1000`). LIVE examples: BB Ki Vines
≈ ₹63L, CarryMinati ≈ ₹42L. This is a reach-based price range, **not** observed income, and
excludes brand deals, merch, and memberships.

---

## 6. Niche-demand forecaster  · **LIVE (model) on SIMULATED series**

Prophet over the 20-niche taxonomy (15 real-anchored + 5 defaults) with an India holiday
calendar (47 entries); 12-week forecasts with 80% / 95% intervals; `niche_forecast_v1.joblib`.

- Top-5 accelerating: Food, Reactions, DIY, Fashion, Vlogs. Declining: Comedy, Gaming,
  Fitness, Parenting, Sports. Ranking is size-weighted by absolute slope.

**Limitation.** There is **no real demand history** (single snapshot), so the weekly series
the model fits is simulated; the forecaster demonstrates the method and ranks niches, but
the slopes are not measured longitudinal trends.

---

## 7. Brand–creator match engine  · **LIVE**

Two-stage ranking. **Stage 1:** embed the brand brief (BGE-small), cosine-rank creator
embeddings to top 200, apply a budget-fit filter and a hard reach floor (`mean_views ≥
5,000`, with an empty-pool fallback that relaxes the floor). **Stage 2 re-rank:**

```
final_score = 0.45·cosine + 0.20·niche_overlap + 0.15·(1 − fraud_risk)
            + 0.10·budget_fit + 0.10·reach_fit
reach_fit   = clip(log10(mean_views + 1) / 6, 0, 1)        # weights sum to 1.0
```

The reach term rewards genuine audience so a high budget surfaces real-reach creators over
cheap dormant channels. The UI shows the full score breakdown so brand users see *why* a
creator ranked where they did.

**A/B test (`match_rerank_v2`).** Variant A = Stage-1 cosine only; Variant B = full two-stage.
Primary metric `shortlist_addition_rate`, guardrail `time_to_first_shortlist_sec`, Bayesian
decision rule. **SIMULATED:** B shows a **23% lift @ 96% credible interval** on a simulated
cohort (`analysis/ab_match_rerank.py`). The PostHog experiment is configured but unlaunched —
no organic traffic — so this is not a real-traffic result.

---

## 8. Creator-lifecycle analysis  · **LIVE (churn/retention real, LTV modeled)**

`analysis/creator_lifecycle.py` segments the corpus by upload dormancy.

- **Churn cohorts (real):** Active 9,072 · Slowing 1,059 · Dormant 626 · Churning 546 ·
  Churned 1,186 → **churn rate 9.5%** (>365d since last upload).
- **Retention curve (real):** active within 7d 60.4% · 30d 72.8% · 90d 81.2% · 180d 86.2% ·
  365d 90.5%.
- **Modeled LTV:** sponsored-cost × 12 campaigns/yr × 3 yrs, **churn-adjusted** by cohort
  (Active 1.0 → Churned 0.0). Mean ≈ ₹30.7L, median ≈ ₹1.14L. This is a **model** under
  stated assumptions, not observed lifetime revenue.

---

## 9. Product analytics  · **LIVE config, SIMULATED traffic**

PostHog instrumentation: 12 events across both persona pages, 2 funnels (creator-engagement,
brand-campaign), 4 cohorts (weekly retention + brand-power / creator-power / multi-persona),
and the `match_rerank_v2` multivariate flag (50/50, 100% rollout). The instrumentation is
real and verified at the provider; all cohort/funnel/A-B *results* are pre-launch and
validated against a simulated cohort.

---

## 10. Fairness & bias considerations

- **Niche-correlated flagging.** Average fraud risk varies by niche (News and Finance read
  highest; Comedy and Entertainment lower). Because labels are heuristic, some of this may
  reflect label correlation rather than true fraud. Per-cluster F1 is tracked in
  `evaluation/baselines/fraud_classifier.json`; any cluster deviating > 20% from the mean is
  flagged for review before the model is trusted on that segment.
- **Language coverage.** BGE-small is English-biased; regional-language creators may embed
  less distinctly, weakening both clustering and match quality for them.
- **Dormant high-subscriber channels** show low `mean_views` and therefore read as low-reach
  and low-cost despite large historical audiences — a single-snapshot artifact, not a
  judgement of the creator.
- **Pricing heuristic.** The CPM × factor cost proxy is an industry heuristic, not a
  market-verified rate, and will be wrong for creators whose real rates differ from niche norms.

---

## 11. Reproducibility

Models are versioned joblibs under `models/` (`fraud_classifier_v1`, `cluster_assignments_v1`,
`niche_forecast_v1`, `earnings_regressor_v1`); MLflow tracks runs; cluster assignments and the
fraud baseline are committed so reruns are comparable. The fraud-cohort fixture
(`evaluation/export_cohort.py`) and the lifecycle analysis (`analysis/creator_lifecycle.py`)
regenerate their numbers from the warehouse; their CSV outputs are derived and gitignored —
the scripts are the source of record.
