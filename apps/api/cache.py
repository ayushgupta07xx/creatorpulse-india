"""Lightweight Redis cache for the product API, backed by Upstash.

Reads ``REDIS_URL`` (an Upstash ``rediss://`` URL). If it is unset, or the redis
client library is not installed, every call is a graceful no-op so the API still
boots and serves. Redis errors are swallowed too -- a cache outage must never break
a request. JSON-serialisable payloads only.
"""

from __future__ import annotations

import json
import os
from typing import Any

try:
    import redis
except ModuleNotFoundError:  # cache is optional; the API must boot without it
    redis = None

_client: Any = None
_disabled = False


def _get_client() -> Any:
    global _client, _disabled
    if _disabled:
        return None
    if _client is None:
        if redis is None:
            _disabled = True
            return None
        url = os.environ.get("REDIS_URL")
        if not url:
            _disabled = True
            return None
        # Upstash requires TLS (rediss://); short timeouts so a cache hiccup can't block the API.
        _client = redis.from_url(
            url, decode_responses=True, socket_connect_timeout=2, socket_timeout=2
        )
    return _client


def cache_get(key: str) -> Any | None:
    client = _get_client()
    if client is None:
        return None
    try:
        raw = client.get(key)
    except Exception:
        return None
    return json.loads(raw) if raw else None


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception:
        return
