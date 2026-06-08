"""One-shot bootstrap ingest of seed channels: YouTube API -> raw + staging.

Reads data/seed_channels.csv (channel_id + niche), fetches static channel info,
lands raw JSON in raw.youtube_channels, upserts staging.channels, and writes one
daily snapshot into staging.channel_metrics_daily. Channels only (no videos) --
the recurring + video ingest lives in apps.ingest.refresh.

Run from the repo root:  python -m apps.ingest.static_ingest
"""

from __future__ import annotations

import csv
import logging
import os
from datetime import UTC, datetime
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

from apps.ingest import normalizer
from apps.ingest.youtube_client import YouTubeClient

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("static_ingest")

SEED_CSV = Path("data/seed_channels.csv")


def load_seed() -> dict[str, str | None]:
    """Return {channel_id: niche} from the seed CSV."""
    niche_by_id: dict[str, str | None] = {}
    with SEED_CSV.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            cid = (row.get("channel_id") or "").strip()
            if cid:
                niche_by_id[cid] = (row.get("niche") or "").strip() or None
    return niche_by_id


def main() -> None:
    load_dotenv()
    api_key = os.environ["YOUTUBE_API_KEY"]
    database_url = os.environ["DATABASE_URL"]

    niche_by_id = load_seed()
    channel_ids = list(niche_by_id)
    logger.info("seed channels: %d", len(channel_ids))

    client = YouTubeClient(api_key)
    records = client.fetch_channels(channel_ids)
    logger.info("API returned %d channels", len(records))

    metric_date = datetime.now(UTC).date()
    raw_rows, staging_rows, metric_rows = normalizer.to_channel_rows(
        records, niche_by_id, metric_date
    )

    conn = psycopg2.connect(database_url)
    try:
        with conn, conn.cursor() as cur:
            normalizer.load_channels(cur, raw_rows, staging_rows, metric_rows)
        logger.info(
            "ingest complete: raw=%d staging.channels=%d metrics(%s)=%d",
            len(raw_rows),
            len(staging_rows),
            metric_date,
            len(metric_rows),
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
