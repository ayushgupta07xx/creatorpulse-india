"""One-shot Upstash/Redis smoke test.

SETs a known key, GETs it back, and reports the round-trip — proving the ``REDIS_URL``
connection actually reaches Upstash (verifiable in the Upstash Data Browser). This is the
isolated provider check: the API "working" does not prove cache writes land, a no-op would
look identical, so confirm the round-trip here.

    set -a; source .env; set +a
    python scripts/smoke_redis.py
"""

from __future__ import annotations

import os
import time

import redis


def main() -> None:
    url = os.environ.get("REDIS_URL")
    if not url:
        raise SystemExit("REDIS_URL not set (expected an Upstash rediss:// URL)")

    client = redis.from_url(url, decode_responses=True, socket_connect_timeout=5, socket_timeout=5)
    key = "creatorpulse:smoke"
    value = f"ok-{int(time.time())}"

    client.set(key, value, ex=60)
    got = client.get(key)
    if got != value:
        raise SystemExit(f"round-trip mismatch: set {value!r}, got {got!r}")

    print(f"Upstash round-trip OK: {key} = {got} (ttl {client.ttl(key)}s)")
    print("Verify in the Upstash console -> Data Browser: the key should be visible.")


if __name__ == "__main__":
    main()
