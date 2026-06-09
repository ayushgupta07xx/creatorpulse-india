"""Feature engineering for the engagement-fraud classifier.

Two responsibilities:

1. ``extract_real_features`` — genuine extraction over the real channels in
   ``marts.mart_creator_features``. Engagement, cadence and recency columns are
   live; growth-velocity columns are NULL today (the warehouse holds a single
   ``channel_metrics_daily`` snapshot date, so ``growth_observations = 0``).
   ``engagement_rate_gini`` is computed here from per-video engagement in
   ``marts.fact_video``; ``country_consistency_score`` is not derivable from the
   public YouTube Data API (no audience-geo without channel-owner OAuth) and is
   left NULL for real channels.

2. ``simulate_cohort`` — because the real population is 52 channels with dead
   growth features, the labelled training cohort is SYNTHESISED: normals are
   sampled from the real engagement/cadence distributions, a fraud subpopulation
   is injected with the signatures the heuristic rules key on, and the
   growth/Gini/geo features the rules need are generated. Every simulated row is
   tagged ``is_simulated = True``. Any metric trained on this cohort is reported
   as "validated against a simulated cohort", never as observed fraud.
"""

from __future__ import annotations

import os

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

# Numeric features the classifier consumes (identifiers/categoricals excluded).
FEATURE_COLUMNS: list[str] = [
    "subscriber_count",
    "view_count",
    "video_count",
    "days_since_last_upload",
    "videos_last_30d",
    "videos_last_90d",
    "mean_engagement_rate",
    "median_engagement_rate",
    "mean_to_median_er_ratio",
    "engagement_cv",
    "mean_like_rate",
    "mean_comment_rate",
    "mean_comment_to_like_ratio",
    "mean_inter_video_days",
    "std_inter_video_days",
    "posting_irregularity",
    "max_subscriber_spike",
    "std_subscriber_growth_pct",
    "mean_subscriber_growth_pct",
    "growth_spike_count",
    "engagement_rate_gini",
    "country_consistency_score",
]

# Columns sampled from the real population to seed the simulated normals.
_SAMPLEABLE = [
    "subscriber_count",
    "view_count",
    "video_count",
    "days_since_last_upload",
    "videos_last_30d",
    "videos_last_90d",
    "mean_engagement_rate",
    "median_engagement_rate",
    "mean_to_median_er_ratio",
    "engagement_cv",
    "mean_like_rate",
    "mean_comment_rate",
    "mean_comment_to_like_ratio",
    "mean_inter_video_days",
    "std_inter_video_days",
]


def get_engine():
    """SQLAlchemy engine from ``DATABASE_URL`` (psycopg2 driver)."""
    url = os.environ["DATABASE_URL"]
    return create_engine(url)


def gini(values: np.ndarray) -> float:
    """Gini coefficient of a non-negative distribution. NaN if empty."""
    x = np.asarray(values, dtype=float)
    x = x[~np.isnan(x)]
    if x.size == 0:
        return float("nan")
    x = np.sort(np.clip(x, 0.0, None))
    if x[-1] == 0:
        return 0.0
    n = x.size
    cum = np.cumsum(x)
    return float((n + 1 - 2 * cum.sum() / cum[-1]) / n)


def _per_channel_gini(engine) -> pd.Series:
    """engagement_rate Gini per channel, computed from marts.fact_video."""
    vids = pd.read_sql(
        text("select channel_id, engagement_rate from marts.fact_video"),
        engine,
    )
    vids["engagement_rate"] = pd.to_numeric(vids["engagement_rate"], errors="coerce")
    return vids.groupby("channel_id")["engagement_rate"].apply(lambda s: gini(s.to_numpy()))


def extract_real_features(engine) -> pd.DataFrame:
    """Real per-channel feature table. Growth + country_consistency stay NULL."""
    df = pd.read_sql(text("select * from marts.mart_creator_features"), engine)

    # numeric (Postgres NUMERIC arrives as Decimal/object) -> float
    for col in df.columns:
        if col not in ("channel_id", "niche", "country"):
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df["engagement_rate_gini"] = df["channel_id"].map(_per_channel_gini(engine))
    df["posting_irregularity"] = df["std_inter_video_days"] / df["mean_inter_video_days"].replace(
        0, np.nan
    )
    # not derivable from the public API for real channels
    df["country_consistency_score"] = np.nan
    if "growth_spike_count" not in df.columns:
        df["growth_spike_count"] = np.nan

    df["is_simulated"] = False
    return df


def simulate_cohort(
    real: pd.DataFrame,
    n: int = 200,
    fraud_frac: float = 0.33,
    seed: int = 42,
) -> pd.DataFrame:
    """Synthesise an n-creator cohort: real-sampled normals + injected fraud.

    Calibrated against the live 52-channel distributions; tagged is_simulated.
    """
    rng = np.random.default_rng(seed)
    n_fraud = int(n * fraud_frac)
    n_norm = n - n_fraud

    def sample(col: str, k: int, jitter: float = 0.15) -> np.ndarray:
        base = rng.choice(real[col].dropna().to_numpy(), k, replace=True)
        return base * (1 + rng.normal(0, jitter, k))

    rows = {c: np.concatenate([sample(c, n_norm), sample(c, n_fraud)]) for c in _SAMPLEABLE}
    df = pd.DataFrame(rows)

    # Fraud-signature overrides on the injected subpopulation (indices n_norm:).
    fr = slice(n_norm, n)
    df.loc[fr, "mean_to_median_er_ratio"] = np.clip(
        rng.normal(4.5, 1.2, n_fraud), 0.8, 9
    )  # rule 2: engagement skew
    df.loc[fr, "mean_comment_to_like_ratio"] = np.clip(
        rng.normal(0.0025, 0.0015, n_fraud), 1e-4, 0.05
    )  # rule 3: starved comments
    df.loc[fr, "engagement_cv"] = np.clip(rng.normal(0.95, 0.3, n_fraud), 0.1, 2.0)

    # Growth / Gini / geo features (dead on real data, generated for the cohort).
    df["max_subscriber_spike"] = np.r_[rng.gamma(2, 1500, n_norm), rng.gamma(3, 12000, n_fraud)]
    df["std_subscriber_growth_pct"] = np.r_[
        np.abs(rng.normal(2, 1.5, n_norm)), np.abs(rng.normal(8, 3, n_fraud))
    ]
    df["mean_subscriber_growth_pct"] = np.r_[rng.normal(1.5, 1, n_norm), rng.normal(4, 3, n_fraud)]
    df["growth_spike_count"] = np.r_[rng.poisson(0.4, n_norm), rng.poisson(3.5, n_fraud)].astype(
        float
    )
    df["engagement_rate_gini"] = np.clip(
        np.r_[rng.normal(0.45, 0.12, n_norm), rng.normal(0.88, 0.08, n_fraud)],
        0.05,
        0.99,
    )
    df["country_consistency_score"] = np.r_[
        rng.choice([1, 1, 1, 0], n_norm), rng.choice([0, 0, 0, 1], n_fraud)
    ].astype(float)

    df["posting_irregularity"] = df["std_inter_video_days"] / df["mean_inter_video_days"].replace(
        0, np.nan
    )
    df["channel_id"] = [f"SIM-{i:04d}" for i in range(n)]
    df["is_simulated"] = True
    return df.reset_index(drop=True)


def heuristic_label(df: pd.DataFrame) -> np.ndarray:
    """6 hand-tuned rules; >=3 fire => suspicious (label 1). Spec section 12."""
    spike_hi = df["max_subscriber_spike"] > df["max_subscriber_spike"].quantile(0.75)
    r1 = (spike_hi & (df["std_subscriber_growth_pct"] > 5)).astype(int)
    r2 = (df["mean_to_median_er_ratio"] > 3).astype(int)
    r3 = (df["mean_comment_to_like_ratio"] < 0.005).astype(int)
    r4 = (df["country_consistency_score"] == 0).astype(int)
    r5 = (df["engagement_rate_gini"] > 0.8).astype(int)
    # rule 6 (comment-bot username %) needs commenter data we do not ingest -> omitted
    fired = r1 + r2 + r3 + r4 + r5
    return (fired >= 3).astype(int).to_numpy()
