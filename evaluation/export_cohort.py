"""Freeze the simulated fraud cohort to a committed fixture for the CI eval gate.

build_dataset() samples real feature distributions from the operational DB, which
CI does not have. Run this ONCE locally with Postgres up; it writes the feature
matrix + labels the model-eval gate retrains on, and verifies the regenerated
labels still match the committed ground_truth_labels.csv so the fixture stays
consistent with evaluation/baselines/fraud_classifier.json.

Run:
    docker start creatorpulse-postgres && sleep 5
    python evaluation/export_cohort.py
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from apps.ml.features import FEATURE_COLUMNS
from apps.ml.fraud_classifier import LABELS_PATH, build_dataset

OUT = Path(__file__).resolve().parent / "cohort.csv"


def main() -> None:
    x_obs, y, labels = build_dataset()

    df = pd.DataFrame(x_obs, columns=FEATURE_COLUMNS)
    df.insert(0, "channel_id", labels["channel_id"].to_numpy())
    df["label"] = y

    # Consistency check: the regenerated labels must still match the committed
    # ground truth, or the fixture has drifted from the baseline it's compared to.
    committed = pd.read_csv(LABELS_PATH)
    agreement = float((committed["label"].to_numpy() == y).mean())
    print(f"label agreement vs committed ground_truth_labels.csv: {agreement:.3f}")
    if agreement < 0.99:
        print(
            "WARNING: cohort drifted from the committed baseline "
            "(DB metrics may have changed since the baseline run). "
            "Review before committing cohort.csv."
        )

    df.to_csv(OUT, index=False)
    print(f"wrote {OUT}  ({len(df)} rows, {len(FEATURE_COLUMNS)} features)")


if __name__ == "__main__":
    main()
