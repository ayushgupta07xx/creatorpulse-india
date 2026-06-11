"""Model-eval gate: retrain the fraud classifier on the committed cohort and
fail if holdout F1 regresses more than 5% vs the committed baseline.

DB-free and deterministic: reads evaluation/cohort.csv (frozen by
evaluation/export_cohort.py) and evaluation/baselines/fraud_classifier.json,
mirroring the train/holdout split and model construction in
apps/ml/fraud_classifier.main() so the number reproduces the baseline.

Run:  python evaluation/check_regression.py   (exit 1 on regression)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd
import xgboost as xgb
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split

from apps.ml.features import FEATURE_COLUMNS

HERE = Path(__file__).resolve().parent
COHORT = HERE / "cohort.csv"
BASELINE = HERE / "baselines" / "fraud_classifier.json"
SEED = 42
TOLERANCE = 0.05  # max allowed relative drop in holdout F1


def main() -> int:
    if not COHORT.exists():
        print(f"ERROR: {COHORT} missing — run evaluation/export_cohort.py first.")
        return 1

    baseline = json.loads(BASELINE.read_text())
    df = pd.read_csv(COHORT)
    x = df[FEATURE_COLUMNS].to_numpy(dtype=float)
    y = df["label"].to_numpy()

    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.2, stratify=y, random_state=SEED)
    model = xgb.XGBClassifier(
        **baseline["best_params"],
        eval_metric="logloss",
        tree_method="hist",
        random_state=SEED,
    )
    model.fit(x_tr, y_tr)
    holdout_f1 = float(f1_score(y_te, model.predict(x_te)))

    base = float(baseline["holdout_f1"])
    rel_drop = (base - holdout_f1) / base
    print(
        f"baseline holdout_f1={base:.4f}  current={holdout_f1:.4f}  "
        f"rel_drop={rel_drop:+.4f}  (cv_f1 baseline={baseline['cv_f1']:.4f})"
    )

    if rel_drop > TOLERANCE:
        print(f"FAIL: holdout F1 regressed more than {TOLERANCE:.0%} vs baseline")
        return 1
    print("PASS: model-eval gate satisfied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
