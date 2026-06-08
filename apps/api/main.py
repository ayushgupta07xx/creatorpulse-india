"""Minimal ops API. Exposes daily YouTube quota usage at /metrics.

Run locally from the repo root:  uvicorn apps.api.main:app --port 8000
(then GET http://localhost:8000/metrics)
"""

from __future__ import annotations

from fastapi import FastAPI

from apps.ingest import quota_tracker

app = FastAPI(title="CreatorPulse Ops", version="0.1.0")


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/metrics")
def metrics() -> dict:
    return quota_tracker.usage()
