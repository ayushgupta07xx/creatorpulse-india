"""Thin wrapper around the python-youtube (pyyoutube) Client.

Fetches static channel info (channels.list, 50 ids/call) and recent videos
(playlistItems.list -> videos.list), each with retry + exponential backoff.
Tracks cumulative YouTube quota units consumed via ``units_used``.
"""

from __future__ import annotations

import logging
import re
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pyyoutube import Client

try:
    from pyyoutube import PyYouTubeException
except ImportError:  # pragma: no cover
    from pyyoutube.error import PyYouTubeException

logger = logging.getLogger(__name__)

CHANNELS_BATCH = 50  # channels.list accepts up to 50 ids per call
VIDEOS_BATCH = 50  # videos.list accepts up to 50 ids per call
CHANNEL_PARTS = ["snippet", "statistics"]
VIDEO_PARTS = ["snippet", "statistics", "contentDetails"]
PLAYLIST_PARTS = ["contentDetails"]

_DURATION_RE = re.compile(
    r"P(?:(?P<days>\d+)D)?T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?"
)


def _to_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _duration_to_seconds(iso: Any) -> int | None:
    """Parse an ISO-8601 duration (e.g. ``PT1H2M3S``) into whole seconds."""
    if not iso or not isinstance(iso, str):
        return None
    m = _DURATION_RE.fullmatch(iso)
    if not m:
        return None
    p = {k: int(v) for k, v in m.groupdict(default="0").items()}
    return p["days"] * 86400 + p["hours"] * 3600 + p["minutes"] * 60 + p["seconds"]


def uploads_playlist_id(channel_id: str) -> str:
    """A channel's uploads playlist id is its channel id with the UC prefix -> UU."""
    return "UU" + channel_id[2:] if channel_id.startswith("UC") else channel_id


@dataclass
class ChannelRecord:
    channel_id: str
    title: str | None
    custom_url: str | None
    description: str | None
    country: str | None
    default_language: str | None
    published_at: str | None
    subscriber_count: int | None
    view_count: int | None
    video_count: int | None
    thumbnail_url: str | None
    raw: dict


@dataclass
class VideoRecord:
    video_id: str
    channel_id: str | None
    title: str | None
    description: str | None
    published_at: str | None
    view_count: int | None
    like_count: int | None
    comment_count: int | None
    duration_seconds: int | None
    tags: list[str] | None
    thumbnail_url: str | None
    raw: dict


class YouTubeClient:
    def __init__(self, api_key: str, *, max_retries: int = 4, backoff_base: float = 1.5) -> None:
        self._client = Client(api_key=api_key)
        self._max_retries = max_retries
        self._backoff_base = backoff_base
        self._units = 0

    @property
    def units_used(self) -> int:
        return self._units

    def _retry(self, label: str, fn: Callable[[], Any]) -> Any:
        last_exc: Exception | None = None
        for attempt in range(self._max_retries):
            try:
                return fn()
            except PyYouTubeException as exc:
                last_exc = exc
                sleep_s = self._backoff_base**attempt
                logger.warning(
                    "%s failed (attempt %d/%d): %s; backing off %.1fs",
                    label,
                    attempt + 1,
                    self._max_retries,
                    exc,
                    sleep_s,
                )
                time.sleep(sleep_s)
        assert last_exc is not None
        raise last_exc

    @staticmethod
    def _thumbnail_url(snippet: Any) -> str | None:
        thumbs = getattr(snippet, "thumbnails", None)
        for size in ("high", "medium", "default"):
            t = getattr(thumbs, size, None) if thumbs else None
            if t and getattr(t, "url", None):
                return t.url
        return None

    @staticmethod
    def _raw_payload(item: Any) -> dict:
        try:
            return item.to_dict()
        except Exception:  # noqa: BLE001 - fall back to a minimal dict
            return {"id": getattr(item, "id", None)}

    # ---- channels -------------------------------------------------------
    def _channels_list(self, ids: list[str]) -> Any:
        self._units += 1
        return self._retry(
            "channels.list",
            lambda: self._client.channels.list(channel_id=ids, parts=CHANNEL_PARTS),
        )

    def fetch_channels(self, channel_ids: list[str]) -> list[ChannelRecord]:
        """Fetch static channel info for any number of ids, batching at 50/call."""
        records: list[ChannelRecord] = []
        for start in range(0, len(channel_ids), CHANNELS_BATCH):
            batch = channel_ids[start : start + CHANNELS_BATCH]
            resp = self._channels_list(batch)
            for item in resp.items or []:
                snip = item.snippet
                stats = item.statistics
                records.append(
                    ChannelRecord(
                        channel_id=item.id,
                        title=getattr(snip, "title", None),
                        custom_url=getattr(snip, "customUrl", None),
                        description=getattr(snip, "description", None),
                        country=getattr(snip, "country", None),
                        default_language=getattr(snip, "defaultLanguage", None),
                        published_at=getattr(snip, "publishedAt", None),
                        subscriber_count=_to_int(getattr(stats, "subscriberCount", None)),
                        view_count=_to_int(getattr(stats, "viewCount", None)),
                        video_count=_to_int(getattr(stats, "videoCount", None)),
                        thumbnail_url=self._thumbnail_url(snip),
                        raw=self._raw_payload(item),
                    )
                )
        return records

    # ---- videos ---------------------------------------------------------
    def _playlist_items(self, playlist_id: str, count: int) -> Any:
        self._units += 1
        return self._retry(
            "playlistItems.list",
            lambda: self._client.playlistItems.list(
                playlist_id=playlist_id, parts=PLAYLIST_PARTS, max_results=count
            ),
        )

    def _videos_list(self, ids: list[str]) -> Any:
        self._units += 1
        return self._retry(
            "videos.list",
            lambda: self._client.videos.list(video_id=ids, parts=VIDEO_PARTS),
        )

    def fetch_recent_video_ids(self, channel_id: str, max_videos: int = 10) -> list[str]:
        """Most-recent uploaded video ids for a channel (via its UU uploads playlist)."""
        playlist_id = uploads_playlist_id(channel_id)
        try:
            resp = self._playlist_items(playlist_id, max_videos)
        except PyYouTubeException as exc:
            logger.warning("playlistItems.list skipped for %s: %s", channel_id, exc)
            return []
        ids: list[str] = []
        for item in resp.items or []:
            cd = getattr(item, "contentDetails", None)
            vid = getattr(cd, "videoId", None) if cd else None
            if vid:
                ids.append(vid)
        return ids

    def fetch_videos(self, video_ids: list[str]) -> list[VideoRecord]:
        """Fetch video stats for any number of ids, batching at 50/call."""
        records: list[VideoRecord] = []
        for start in range(0, len(video_ids), VIDEOS_BATCH):
            batch = video_ids[start : start + VIDEOS_BATCH]
            resp = self._videos_list(batch)
            for item in resp.items or []:
                snip = item.snippet
                stats = item.statistics
                content = item.contentDetails
                records.append(
                    VideoRecord(
                        video_id=item.id,
                        channel_id=getattr(snip, "channelId", None),
                        title=getattr(snip, "title", None),
                        description=getattr(snip, "description", None),
                        published_at=getattr(snip, "publishedAt", None),
                        view_count=_to_int(getattr(stats, "viewCount", None)),
                        like_count=_to_int(getattr(stats, "likeCount", None)),
                        comment_count=_to_int(getattr(stats, "commentCount", None)),
                        duration_seconds=_duration_to_seconds(getattr(content, "duration", None)),
                        tags=getattr(snip, "tags", None),
                        thumbnail_url=self._thumbnail_url(snip),
                        raw=self._raw_payload(item),
                    )
                )
        return records

    def fetch_channel_videos(
        self, channel_ids: list[str], max_per_channel: int = 10
    ) -> list[VideoRecord]:
        """Recent videos for many channels: playlistItems per channel -> batched videos.list."""
        video_ids: list[str] = []
        for cid in channel_ids:
            video_ids.extend(self.fetch_recent_video_ids(cid, max_per_channel))
        logger.info("collected %d video ids across %d channels", len(video_ids), len(channel_ids))
        if not video_ids:
            return []
        return self.fetch_videos(video_ids)

    # ---- discovery (best-effort; search.list costs 100 units/call) ------
    def search_channels(
        self, query: str, *, region_code: str = "IN", max_results: int = 10
    ) -> list[str]:
        """Best-effort channel discovery via search.list (official API, quota-heavy)."""
        self._units += 100
        resp = self._retry(
            "search.list",
            lambda: self._client.search.list(
                q=query,
                parts=["snippet"],
                search_type="channel",
                region_code=region_code,
                max_results=max_results,
            ),
        )
        ids: list[str] = []
        for item in resp.items or []:
            sid = getattr(item, "id", None)
            cid = getattr(sid, "channelId", None) if sid else None
            if cid:
                ids.append(cid)
        return ids
