"""File-backed daily YouTube quota tracker (10,000 units/day free).

Persists per-day, per-source unit consumption to a JSON file so the recurring
DAGs and the /metrics endpoint share one view. Local single-host use:
last-write-wins on concurrent updates (acceptable -- LocalExecutor serializes
the ingest tasks). Persistence is best-effort: a write failure never propagates,
because quota tracking is observability and must not fail an ingest run.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import UTC, date, datetime
from pathlib import Path

logger = logging.getLogger("quota_tracker")

DAILY_LIMIT = 10_000
DEFAULT_PATH = Path(os.environ.get("QUOTA_USAGE_PATH", "data/quota_usage.json"))


def _today() -> str:
    return datetime.now(UTC).date().isoformat()


def _load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def record(units: int, *, source: str = "ingest", path: Path | None = None) -> dict:
    """Add ``units`` to today's bucket under ``source`` and persist (best-effort).

    Returns today's bucket. A write failure (e.g. a read-only mount) logs a
    warning and is swallowed -- it never fails the calling ingest task.
    """
    path = path or DEFAULT_PATH
    data = _load(path)
    day = data.setdefault(_today(), {"total": 0, "by_source": {}})
    day["total"] += int(units)
    day["by_source"][source] = day["by_source"].get(source, 0) + int(units)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
        logger.info("quota +%d (%s) -> %d/%d today", units, source, day["total"], DAILY_LIMIT)
    except OSError as exc:
        logger.warning("quota write to %s failed (%s); not persisted", path, exc)
    return day


def usage(day: str | date | None = None, *, path: Path | None = None) -> dict:
    """Return {date, units_used, units_remaining, daily_limit, by_source} for a day."""
    path = path or DEFAULT_PATH
    if isinstance(day, date):
        day = day.isoformat()
    day = day or _today()
    bucket = _load(path).get(day, {"total": 0, "by_source": {}})
    used = int(bucket.get("total", 0))
    return {
        "date": day,
        "units_used": used,
        "units_remaining": max(DAILY_LIMIT - used, 0),
        "daily_limit": DAILY_LIMIT,
        "by_source": bucket.get("by_source", {}),
    }
