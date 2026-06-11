"""Unit tests for the torch-free, DB-free feature helpers (apps/ml/features.py).

Covers the Gini coefficient and the 6-rule heuristic labeller. The DB-backed
extract_real_features / simulate_cohort paths are integration-tested separately.
"""

import numpy as np
import pandas as pd
import pytest

from apps.ml.features import gini, heuristic_label


def test_gini_equal_distribution_is_zero():
    assert gini(np.array([5.0, 5.0, 5.0, 5.0])) == pytest.approx(0.0)


def test_gini_fully_concentrated():
    # One unit on the last of four -> 0.75 by the implemented formula.
    assert gini(np.array([0.0, 0.0, 0.0, 1.0])) == pytest.approx(0.75)


def test_gini_linear_spread():
    assert gini(np.array([1.0, 2.0, 3.0, 4.0])) == pytest.approx(0.25)


def test_gini_drops_nan():
    assert gini(np.array([5.0, 5.0, np.nan, 5.0, 5.0])) == pytest.approx(0.0)


def test_gini_empty_is_nan():
    assert np.isnan(gini(np.array([])))


def test_gini_all_zero_is_zero():
    assert gini(np.array([0.0, 0.0, 0.0])) == 0.0


def _row(spike, std_growth, er_ratio, ctl_ratio, country, gini_val):
    """One creator-feature row keyed to the columns heuristic_label reads."""
    return {
        "max_subscriber_spike": spike,
        "std_subscriber_growth_pct": std_growth,
        "mean_to_median_er_ratio": er_ratio,
        "mean_comment_to_like_ratio": ctl_ratio,
        "country_consistency_score": country,
        "engagement_rate_gini": gini_val,
    }


def test_heuristic_label_clean_vs_fraud():
    clean = _row(1_000, 1.0, 1.2, 0.02, 1, 0.40)
    # fraud fires r1 (spike>q75 & std>5), r2 (er>3), r3 (ctl<0.005), r5 (gini>0.8) = 4 rules
    fraud = _row(50_000, 8.0, 5.0, 0.001, 1, 0.90)
    df = pd.DataFrame([clean, clean, clean, clean, fraud, fraud])
    assert heuristic_label(df).tolist() == [0, 0, 0, 0, 1, 1]


def test_heuristic_label_two_rules_is_not_suspicious():
    # Target fires only r2 (er>3) and r5 (gini>0.8) -> 2 < 3 -> label 0.
    clean = _row(1_000, 1.0, 1.2, 0.02, 1, 0.40)
    target = _row(1_000, 1.0, 5.0, 0.02, 1, 0.90)
    df = pd.DataFrame([clean, clean, clean, target])
    assert heuristic_label(df).tolist()[-1] == 0
