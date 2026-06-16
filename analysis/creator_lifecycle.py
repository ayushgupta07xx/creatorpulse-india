"""Creator-lifecycle cohort analysis.

Segments the indexed creators into lifecycle cohorts by upload dormancy, builds a
retention curve, and computes a modeled creator LTV.

Churn cohorts and the retention curve are REAL — derived from
``days_since_last_upload`` on the live corpus. LTV is a MODELED estimate under the
stated assumptions below (sponsored-cost per campaign x campaigns/yr x commercial
lifespan), churn-adjusted by cohort so dormant/churned creators carry little or no
projected value. Treat the LTV figures as a model, not observed revenue.

Run (with Postgres up):
    docker start creatorpulse-postgres && sleep 3
    python analysis/creator_lifecycle.py
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from apps.ml.features import get_engine

# Sponsored-cost pricing (matches apps/ml/pricing.py): mean_views * CPM * factor / 1000
CPM = {
    "Finance": 80,
    "Tech": 40,
    "Education": 35,
    "Beauty": 25,
    "Gaming": 20,
    "Entertainment": 15,
}
DEFAULT_CPM = 25
SPONSOR_FACTOR = 20

# LTV model assumptions (modeled, not observed):
CAMPAIGNS_PER_YEAR = 12  # ~one sponsored slot a month for an active creator
ACTIVE_YEARS = 3  # assumed commercial lifespan of an engaged creator

# (lower, upper] days-since-upload -> (cohort label, LTV retention factor)
BANDS = [
    (0, 30, "Active", 1.0),
    (30, 90, "Slowing", 0.7),
    (90, 180, "Dormant", 0.4),
    (180, 365, "Churning", 0.15),
    (365, float("inf"), "Churned", 0.0),
]
ORDER = ["Active", "Slowing", "Dormant", "Churning", "Churned"]
OUT = Path(__file__).resolve().parent / "output"


def _band(days: float) -> str:
    for lo, hi, name, _ in BANDS:
        if lo <= days < hi:
            return name
    return "Churned"


def _retention_factor(days: float) -> float:
    for lo, hi, _, rf in BANDS:
        if lo <= days < hi:
            return rf
    return 0.0


def main() -> None:
    eng = get_engine()
    df = pd.read_sql(
        "SELECT channel_id, niche, mean_views, days_since_last_upload "
        "FROM marts.mart_creator_features",
        eng,
    )
    df = df.dropna(subset=["days_since_last_upload"])

    df["est_cost_inr"] = (
        df["mean_views"]
        * df["niche"].map(lambda n: CPM.get(n, DEFAULT_CPM))
        * SPONSOR_FACTOR
        / 1000
    )
    df["lifecycle"] = df["days_since_last_upload"].map(_band)
    df["retention_factor"] = df["days_since_last_upload"].map(_retention_factor)
    df["ltv_modeled_inr"] = (
        df["est_cost_inr"] * CAMPAIGNS_PER_YEAR * ACTIVE_YEARS * df["retention_factor"]
    )

    cohorts = df["lifecycle"].value_counts().reindex(ORDER)
    churn_rate = float((df["lifecycle"] == "Churned").mean())

    print("Churn cohorts (real — by upload dormancy):")
    print(cohorts.to_string())
    print(f"Churn rate (>365d dormant): {churn_rate * 100:.1f}%\n")

    print("Retention curve (% of creators active within N days):")
    for n in (7, 30, 90, 180, 365):
        pct = float((df["days_since_last_upload"] <= n).mean()) * 100
        print(f"  {n:>3}d: {pct:.1f}%")

    print(
        f"\nModeled creator LTV (₹) — assumptions: {CAMPAIGNS_PER_YEAR} campaigns/yr"
        f" x {ACTIVE_YEARS} yrs, churn-adjusted by cohort:"
    )
    print(
        f"  mean ₹{df['ltv_modeled_inr'].mean():,.0f}  |  "
        f"median ₹{df['ltv_modeled_inr'].median():,.0f}"
    )

    OUT.mkdir(exist_ok=True)
    by_niche = (
        df.groupby("niche")
        .agg(
            creators=("channel_id", "count"),
            churned_pct=("lifecycle", lambda s: float((s == "Churned").mean())),
            mean_ltv_inr=("ltv_modeled_inr", "mean"),
        )
        .reset_index()
        .sort_values("mean_ltv_inr", ascending=False)
    )
    by_niche.to_csv(OUT / "creator_lifecycle_by_niche.csv", index=False)
    df[
        [
            "channel_id",
            "niche",
            "lifecycle",
            "retention_factor",
            "est_cost_inr",
            "ltv_modeled_inr",
        ]
    ].to_csv(OUT / "creator_lifecycle.csv", index=False)
    print(f"\nwrote {OUT}/creator_lifecycle.csv and creator_lifecycle_by_niche.csv")


if __name__ == "__main__":
    main()
