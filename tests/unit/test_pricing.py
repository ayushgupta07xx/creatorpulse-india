"""Unit tests for the reach-based sponsored-cost proxy (apps/ml/pricing.py).

Torch-free and DB-free: pure arithmetic over the committed CPM table, so this
runs fast in CI without Postgres or sentence-transformers.
"""

import pytest

from apps.ml.pricing import CPM, CPM_DEFAULT, SPONSORED_CPM_FACTOR, sponsored_cost


def test_known_niche_uses_table_cpm():
    # 100k views, Tech CPM 40, factor 20 -> 100000 * 40 * 20 / 1000
    assert sponsored_cost(100_000, "Tech") == pytest.approx(80_000.0)


def test_unknown_niche_falls_back_to_default_cpm():
    expected = 100_000 * CPM_DEFAULT * SPONSORED_CPM_FACTOR / 1000.0
    assert sponsored_cost(100_000, "NotARealNiche") == pytest.approx(expected)


@pytest.mark.parametrize("bad", [None, float("nan")])
def test_missing_views_is_nan_safe_returns_zero(bad):
    assert sponsored_cost(bad, "Tech") == 0.0


def test_zero_views_is_zero():
    assert sponsored_cost(0, "Finance") == 0.0


def test_returns_float():
    assert isinstance(sponsored_cost(50_000, "Beauty"), float)


def test_higher_cpm_niche_costs_more_at_equal_reach():
    # Finance (80) must price above Entertainment (15) for identical reach.
    assert sponsored_cost(1_000_000, "Finance") > sponsored_cost(1_000_000, "Entertainment")


def test_cpm_table_constants_match_spec():
    # Guards the single-source CPM table against silent drift (05_CreatorPulse.md §14).
    assert CPM["Finance"] == 80
    assert CPM["Tech"] == 40
    assert CPM_DEFAULT == 25
    assert SPONSORED_CPM_FACTOR == 20
