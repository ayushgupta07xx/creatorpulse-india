"""Tier-B refresh: the long tail beyond the top 500, rotated across the week.

Runs daily; each run handles the 1/7 slice of tail channels whose rank maps to
that weekday. At the current 52-channel universe the tail is empty, so this DAG
is a clean no-op until the seed expands (it logs "0 channels" and exits 0).
Same isolated-venv execution model as tier A (see docs/decisions.md).
"""

from __future__ import annotations

import pendulum
from airflow.models.dag import DAG
from airflow.operators.bash import BashOperator

PROJECT_DIR = "/opt/airflow/project"
PY = "/opt/ingest-venv/bin/python"
DOW = "{{ data_interval_start.weekday() }}"  # 0=Mon .. 6=Sun

default_args = {"retries": 2, "retry_delay": pendulum.duration(minutes=5)}

with DAG(
    dag_id="youtube_tier_b",
    description="Weekly tail refresh, rotated daily across 7 slices",
    schedule="@daily",
    start_date=pendulum.datetime(2026, 6, 1, tz="UTC"),
    catchup=False,
    default_args=default_args,
    tags=["youtube", "ingest", "tier-b"],
):
    refresh_channels = BashOperator(
        task_id="refresh_channels",
        bash_command=(
            f"cd {PROJECT_DIR} && {PY} -m apps.ingest.refresh channels --tier b --dow {DOW}"
        ),
    )
    refresh_videos = BashOperator(
        task_id="refresh_videos",
        bash_command=(
            f"cd {PROJECT_DIR} && {PY} -m apps.ingest.refresh videos "
            f"--tier b --dow {DOW} --max-videos 10"
        ),
    )
    refresh_channels >> refresh_videos
