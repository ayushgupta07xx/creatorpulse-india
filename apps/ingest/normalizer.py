"""Transform YouTube records into DB rows and load them (raw + staging).

Pure transforms (records -> tuples) plus execute_values loaders. Both the
one-shot bootstrap (static_ingest) and the recurring DAG runner (refresh) share
these so the upsert SQL lives in exactly one place.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from psycopg2.extras import Json, execute_values

from apps.ingest.youtube_client import ChannelRecord, VideoRecord

# ---- channels -----------------------------------------------------------

_RAW_CHANNELS_SQL = "INSERT INTO raw.youtube_channels (channel_id, payload) VALUES %s"

_STAGING_CHANNELS_SQL = """
INSERT INTO staging.channels (
    channel_id, title, custom_url, description, country,
    default_language, niche, published_at, subscriber_count,
    view_count, video_count, thumbnail_url
) VALUES %s
ON CONFLICT (channel_id) DO UPDATE SET
    title = EXCLUDED.title,
    custom_url = EXCLUDED.custom_url,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    default_language = EXCLUDED.default_language,
    niche = COALESCE(EXCLUDED.niche, staging.channels.niche),
    published_at = EXCLUDED.published_at,
    subscriber_count = EXCLUDED.subscriber_count,
    view_count = EXCLUDED.view_count,
    video_count = EXCLUDED.video_count,
    thumbnail_url = EXCLUDED.thumbnail_url,
    updated_at = now()
"""

_METRICS_SQL = """
INSERT INTO staging.channel_metrics_daily (
    channel_id, metric_date, subscriber_count, view_count, video_count
) VALUES %s
ON CONFLICT (channel_id, metric_date) DO UPDATE SET
    subscriber_count = EXCLUDED.subscriber_count,
    view_count = EXCLUDED.view_count,
    video_count = EXCLUDED.video_count,
    captured_at = now()
"""


def to_channel_rows(
    records: list[ChannelRecord],
    niche_by_id: dict[str, str | None] | None,
    metric_date: date,
) -> tuple[list[tuple], list[tuple], list[tuple]]:
    """Return (raw_rows, staging_rows, metric_rows). niche_by_id may be None on refresh."""
    niches = niche_by_id or {}
    raw_rows = [(r.channel_id, Json(r.raw)) for r in records]
    staging_rows = [
        (
            r.channel_id,
            r.title,
            r.custom_url,
            r.description,
            r.country,
            r.default_language,
            niches.get(r.channel_id),
            r.published_at,
            r.subscriber_count,
            r.view_count,
            r.video_count,
            r.thumbnail_url,
        )
        for r in records
    ]
    metric_rows = [
        (r.channel_id, metric_date, r.subscriber_count, r.view_count, r.video_count)
        for r in records
    ]
    return raw_rows, staging_rows, metric_rows


def load_channels(
    cur: Any, raw_rows: list[tuple], staging_rows: list[tuple], metric_rows: list[tuple]
) -> None:
    if raw_rows:
        execute_values(cur, _RAW_CHANNELS_SQL, raw_rows)
    if staging_rows:
        execute_values(cur, _STAGING_CHANNELS_SQL, staging_rows)
    if metric_rows:
        execute_values(cur, _METRICS_SQL, metric_rows)


# ---- videos -------------------------------------------------------------

_RAW_VIDEOS_SQL = "INSERT INTO raw.youtube_videos (video_id, channel_id, payload) VALUES %s"

_STAGING_VIDEOS_SQL = """
INSERT INTO staging.videos (
    video_id, channel_id, title, description, published_at,
    view_count, like_count, comment_count, duration_seconds, tags, thumbnail_url
) VALUES %s
ON CONFLICT (video_id) DO UPDATE SET
    channel_id = EXCLUDED.channel_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    published_at = EXCLUDED.published_at,
    view_count = EXCLUDED.view_count,
    like_count = EXCLUDED.like_count,
    comment_count = EXCLUDED.comment_count,
    duration_seconds = EXCLUDED.duration_seconds,
    tags = EXCLUDED.tags,
    thumbnail_url = EXCLUDED.thumbnail_url,
    updated_at = now()
"""


def to_video_rows(records: list[VideoRecord]) -> tuple[list[tuple], list[tuple]]:
    """Return (raw_rows, staging_rows) for video records."""
    raw_rows = [(r.video_id, r.channel_id, Json(r.raw)) for r in records]
    staging_rows = [
        (
            r.video_id,
            r.channel_id,
            r.title,
            r.description,
            r.published_at,
            r.view_count,
            r.like_count,
            r.comment_count,
            r.duration_seconds,
            Json(r.tags) if r.tags is not None else None,
            r.thumbnail_url,
        )
        for r in records
    ]
    return raw_rows, staging_rows


def load_videos(cur: Any, raw_rows: list[tuple], staging_rows: list[tuple]) -> None:
    if raw_rows:
        execute_values(cur, _RAW_VIDEOS_SQL, raw_rows)
    if staging_rows:
        execute_values(cur, _STAGING_VIDEOS_SQL, staging_rows)
