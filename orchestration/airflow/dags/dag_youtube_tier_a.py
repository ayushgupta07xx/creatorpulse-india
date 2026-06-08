"""Tier-A daily refresh: top-500 channels by subscriber count (all 52 today).

Refreshes channel stats + a daily metrics snapshot, then ingests the last 10
videos for the same set. Tasks run in the isolated /opt/ingest-venv via
BashOperator, keeping project deps out of Airflow's env (a full editable install
would drag SQLAlchemy 2.0 + Alembic in and collide with Airflow 2.9's SQLAlchemy
1.4 ORM). See docs/decisions.md.
"""

from __future__ import annotations

import pendulum
from airflow.models.dag import DAG
from airflow.operators.bash import BashOperator

PROJECT_DIR = "/opt/airflow/project"
PY = "/opt/ingest-venv/bin/python"

default_args = {"retries": 2, "retry_delay": pendulum.duration(minutes=5)}

with DAG(
    dag_id="youtube_tier_a",
    description="Daily refresh of top-500 channels: stats + last 10 videos each",
    schedule="@daily",
    start_date=pendulum.datetime(2026, 6, 1, tz="UTC"),
    catchup=False,
    default_args=default_args,
    tags=["youtube", "ingest", "tier-a"],
):
    refresh_channels = BashOperator(
        task_id="refresh_channels",
        bash_command=f"cd {PROJECT_DIR} && {PY} -m apps.ingest.refresh channels --tier a",
    )
    refresh_videos = BashOperator(
        task_id="refresh_videos",
        bash_command=(
            f"cd {PROJECT_DIR} && {PY} -m apps.ingest.refresh videos --tier a --max-videos 10"
        ),
    )
    refresh_channels >> refresh_videos
