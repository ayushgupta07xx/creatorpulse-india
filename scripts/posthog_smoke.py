#!/usr/bin/env python3
"""Isolated PostHog smoke test.

Sends ONE known `chat_feedback` event so you can confirm it lands in the PostHog
live feed independently of the app. This is the no-op-key guard: the widget's
window.posthog?.capture?.() silently no-ops if posthog isn't loaded, so a clicking
button proves nothing — the event showing up in the feed (from here AND from the
real widget) is the proof.

Usage (WSL, .venv active, in ~/code/creatorpulse-india):
    export POSTHOG_KEY="phc_xxx"                       # your project API key
    export POSTHOG_HOST="https://us.i.posthog.com"     # or https://eu.i.posthog.com
    python scripts/posthog_smoke.py

Then open PostHog → Activity / live events and look for a `chat_feedback`
event with properties rating="up", smoke=true, distinct_id="cli-smoke".
This is a throwaway local check — does not need to be committed.
"""

import os
import sys

try:
    from posthog import Posthog
except ImportError:
    sys.exit("posthog-python not installed. Run: pip install posthog")

key = os.environ.get("POSTHOG_KEY") or os.environ.get("NEXT_PUBLIC_POSTHOG_KEY")
host = (
    os.environ.get("POSTHOG_HOST")
    or os.environ.get("NEXT_PUBLIC_POSTHOG_HOST")
    or "https://us.i.posthog.com"
)

if not key:
    sys.exit("Set POSTHOG_KEY (your project API key) before running.")

ph = Posthog(project_api_key=key, host=host)
ph.capture(
    distinct_id="cli-smoke",
    event="chat_feedback",
    properties={"rating": "up", "page": "/cli-smoke", "smoke": True},
)
ph.flush()
print(f"sent chat_feedback to {host} — check the PostHog live feed for distinct_id=cli-smoke")
