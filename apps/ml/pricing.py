"""Sponsored-integration cost estimate.

Single source of truth for the campaign-cost / creator-rate estimate, shared by the
match engine (apps/ml/match.py) and the API. Torch-free, so the creator page can
import it without pulling sentence-transformers.

LIVE MODEL — subscriber-tier bands (integration_cost_point / integration_cost_range).
Real integration fees are tiered by audience size and flatten at the top; a per-view
CPM model has no ceiling and overshoots large channels (an 18M-sub channel priced at
median views x CPM came out at ~Rs1.6cr for one video). We map a creator to a standard
influencer tier with a published per-integration INR band, then position it within the
band by reach-per-subscriber (an engagement / activity proxy). The displayed range is a
negotiation spread around that point, clamped to the tier band. Bands are calibrated to
published Indian creator rate cards (mid-tier ~Rs1-5L, top-tier ~Rs15-50L; Rs1cr+ is
full-campaign / exceptional, not one upload). See 05_CreatorPulse.md s14, docs/decisions.md.

Per-channel monthly AdSense is not recoverable from a single metrics snapshot, so this
reach/tier proxy is the live brand number; the OLS AdSense regressor stays a methodology
artifact.

LEGACY — the niche sponsored-CPM band (SPONSORED_CPM_BAND, integration_rate_range,
sponsored_cost) is retained for any pre-tier caller and as a methodology artifact; it is
no longer the live brand number. Do not wire new surfaces to it.
"""

from __future__ import annotations

import pandas as pd

# Niche AdSense CPM (INR per 1000 views) -- earnings methodology artifact and the
# legacy per-creator helper. 05_CreatorPulse.md s14.
CPM = {
    "Finance": 80,
    "Tech": 40,
    "Education": 35,
    "News": 35,
    "Beauty": 25,
    "Fashion": 25,
    "Gaming": 20,
    "Comedy": 15,
    "Entertainment": 15,
    "Reactions": 15,
}
CPM_DEFAULT = 25

# --- LIVE: subscriber-tier integration bands -------------------------------------
# (subscriber ceiling, (low_inr, high_inr)) for one sponsored integration. A creator
# falls in the first tier whose ceiling it is below. Calibrated to published Indian
# creator rate cards; the top tier caps the estimate so per-view scaling can't run away.
SUBSCRIBER_TIER_BANDS: list[tuple[float, tuple[float, float]]] = [
    (50_000, (15_000.0, 75_000.0)),
    (250_000, (50_000.0, 250_000.0)),
    (1_000_000, (150_000.0, 600_000.0)),
    (5_000_000, (400_000.0, 1_800_000.0)),
    (15_000_000, (1_000_000.0, 3_500_000.0)),
    (float("inf"), (1_500_000.0, 5_000_000.0)),
]

# reach-per-subscriber window mapped to within-tier position [0, 1]
_VPS_FLOOR = 0.05
_VPS_SPAN = 0.95  # ceiling 1.0 - floor 0.05
# negotiation spread around the point estimate (clamped to the tier band)
_SPREAD_LO = 0.75
_SPREAD_HI = 1.35


def tier_band(subscriber_count) -> tuple[float, float]:
    """(low, high) INR integration band for a subscriber count."""
    subs = 0.0 if subscriber_count is None or pd.isna(subscriber_count) else float(subscriber_count)
    for ceiling, band in SUBSCRIBER_TIER_BANDS:
        if subs < ceiling:
            return band
    return SUBSCRIBER_TIER_BANDS[-1][1]


def _within_tier_position(reach, subscriber_count) -> float:
    """Where the creator sits in its tier band [0, 1], by reach-per-subscriber."""
    subs = 0.0 if subscriber_count is None or pd.isna(subscriber_count) else float(subscriber_count)
    r = 0.0 if reach is None or pd.isna(reach) else float(reach)
    vps = (r / subs) if subs > 0 else 0.5
    return min(1.0, max(0.0, (vps - _VPS_FLOOR) / _VPS_SPAN))


def integration_cost_point(reach, subscriber_count) -> float:
    """Point estimate (INR) for one sponsored integration, within the tier band."""
    lo, hi = tier_band(subscriber_count)
    t = _within_tier_position(reach, subscriber_count)
    return lo + t * (hi - lo)


def integration_cost_range(reach, subscriber_count) -> tuple[float, float]:
    """Displayed (low, high) INR range -- negotiation spread, clamped to the tier band."""
    lo, hi = tier_band(subscriber_count)
    point = integration_cost_point(reach, subscriber_count)
    low = min(max(point * _SPREAD_LO, lo), hi)
    high = min(max(point * _SPREAD_HI, lo), hi)
    return low, high


# --- LEGACY: niche sponsored-CPM band (retained, not the live number) ------------
# Sponsored-integration CPM band (INR per 1000 views), (low, high) per niche, within
# the published ~INR 500-5,000 range. Superseded by the subscriber-tier model above.
SPONSORED_CPM_BAND = {
    "Finance": (1000, 3000),
    "Tech": (800, 2200),
    "Education": (500, 1400),
    "News": (450, 1200),
    "Beauty": (400, 1100),
    "Fashion": (400, 1100),
    "Gaming": (350, 1000),
    "Comedy": (300, 800),
    "Entertainment": (300, 800),
    "Reactions": (300, 800),
}
SPONSORED_CPM_BAND_DEFAULT = (400, 1000)


def integration_rate_range(reach, niche) -> tuple[float, float]:
    """LEGACY: integration-rate range (INR) from the niche sponsored-CPM band."""
    v = 0.0 if reach is None or pd.isna(reach) else float(reach)
    lo_cpm, hi_cpm = SPONSORED_CPM_BAND.get(niche, SPONSORED_CPM_BAND_DEFAULT)
    return max(1.0, v * lo_cpm / 1000.0), max(1.0, v * hi_cpm / 1000.0)


def sponsored_cost(reach, niche) -> float:
    """LEGACY: midpoint of the niche-CPM-band range (INR)."""
    lo, hi = integration_rate_range(reach, niche)
    return (lo + hi) / 2.0
