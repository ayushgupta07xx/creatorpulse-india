"""CreatorPulse India — product API.

Serves the creator-economy intelligence product to the Next.js (Vercel) frontend:
corpus stats, creator search/profile, niche-demand forecast, and brand->creator
matching. Reads Neon/pgvector + the committed models/ via the shared
apps.ml.match logic (single-sourced with the Streamlit app; the torch/BGE match
engine lives here, where there's memory headroom).

Run locally from the repo root:
    set -a; source .env; set +a
    uvicorn apps.api.main:app --port 8000
"""

from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text

import apps.ml.match as match_engine
from apps.ingest import quota_tracker
from apps.ml.pricing import sponsored_cost

REPO = Path(__file__).resolve().parents[2]
MODELS_DIR = REPO / "models"

# Comma-separated allowed origins for the Vercel frontend; localhost for dev.
_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CREATORPULSE_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if o.strip()
]

_NUMERIC = (
    "subscriber_count",
    "mean_views",
    "view_count",
    "video_count",
    "fraud_risk",
    "est_cost_inr",
    "cosine",
    "niche_overlap",
    "budget_fit",
    "final_score",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm model + catalog so the first user request isn't cold.
    if os.environ.get("DATABASE_URL"):
        try:
            match_engine.get_encoder()
            _display()
        except Exception as e:
            print(f"warmup skipped: {e}")
    else:
        print("DATABASE_URL not set — warmup skipped")
    yield


app = FastAPI(title="CreatorPulse India API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def _display() -> pd.DataFrame:
    """Ranking catalog (cached in match) enriched with display fields."""
    creators, _ = match_engine.get_catalog()
    eng = match_engine.get_engine()
    dim = pd.read_sql(
        text(
            "select distinct on (c.channel_id) c.channel_id, c.title, "
            "s.thumbnail_url from marts.dim_channel c "
            "left join staging.channels s on s.channel_id = c.channel_id "
            "order by c.channel_id, c.effective_from desc"
        ),
        eng,
    )
    df = creators.merge(dim, on="channel_id", how="left")
    for col in _NUMERIC:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


@lru_cache(maxsize=1)
def _forecast() -> dict:
    fc = joblib.load(MODELS_DIR / "niche_forecast_v1.joblib")
    return fc if isinstance(fc, dict) else {}


def _records(df: pd.DataFrame) -> list[dict]:
    """JSON-safe records (NaN -> null, numpy/Decimal -> json)."""
    return json.loads(df.to_json(orient="records", date_format="iso"))


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/metrics")
def metrics() -> dict:
    return quota_tracker.usage()


@app.get("/stats")
def stats() -> dict:
    df = _display()
    return {
        "creators": int(len(df)),
        "niches": int(df["niche"].nunique()),
        "archetypes": int(df["archetype"].nunique()),
    }


@app.get("/creators")
def list_creators(q: str = Query(""), limit: int = 20) -> list[dict]:
    df = _display()
    if q:
        df = df[df["title"].fillna("").str.contains(q, case=False, na=False)]
    cols = [
        c
        for c in (
            "channel_id",
            "title",
            "thumbnail_url",
            "niche",
            "archetype",
            "subscriber_count",
            "mean_views",
            "fraud_risk",
            "est_cost_inr",
        )
        if c in df.columns
    ]
    return _records(df[cols].head(max(1, min(limit, 100))))


@app.get("/creators/{channel_id}")
def get_creator(channel_id: str) -> dict:
    df = _display()
    row = df[df["channel_id"] == channel_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="creator not indexed")
    r = _records(row)[0]
    r["est_sponsored_cost_inr"] = sponsored_cost(r.get("mean_views"), r.get("niche"))
    r["niche_slope"] = _forecast().get("slopes", {}).get(r.get("niche"))
    return r


@app.get("/niches/{niche}/forecast")
def get_niche_forecast(niche: str) -> dict:
    fc = _forecast()
    forecasts = fc.get("forecasts", {})
    if niche not in forecasts:
        raise HTTPException(status_code=404, detail="no forecast for niche")
    series = forecasts[niche]
    if isinstance(series, pd.DataFrame):
        series = _records(series)
    elif isinstance(series, pd.Series):
        series = json.loads(series.to_json(date_format="iso"))
    return {"niche": niche, "slope": fc.get("slopes", {}).get(niche), "forecast": series}


class MatchRequest(BaseModel):
    brief: str
    budget_lakh: float = 15.0
    top_k: int = 20
    rerank: bool = True
    niche_filter: str | None = None
    min_views: float = match_engine.MIN_VIEWS_DEFAULT


@app.post("/match")
def post_match(req: MatchRequest) -> list[dict]:
    out = match_engine.match(
        req.brief,
        budget_lakh=req.budget_lakh,
        top_k=req.top_k,
        rerank=req.rerank,
        niche_filter=req.niche_filter,
        min_views=req.min_views,
    )
    disp_cols = [
        c
        for c in ("channel_id", "title", "thumbnail_url", "subscriber_count", "mean_views")
        if c in _display().columns
    ]
    out = out.merge(_display()[disp_cols], on="channel_id", how="left")
    return _records(out)
