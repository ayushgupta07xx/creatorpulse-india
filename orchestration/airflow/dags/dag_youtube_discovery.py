"""Discovery: weekly best-effort universe expansion via search.list.

Queries the official search API per existing niche ("<niche> India", channel
type, region IN), dedupes against staging.channels, and ingests new candidates.
search.list costs 100 units/call, so this is quota-gated and stays PAUSED by
default (global DAGS_ARE_PAUSED_AT_CREATION=true) -- unpause manually to run.
Best-effort by design: no artifact claims a creator count it hasn't ingested.
"""

from __future__ import annotations

import pendulum
from airflow.models.dag import DAG
from airflow.operators.bash import BashOperator

PROJECT_DIR = "/opt/airflow/project"
PY = "/opt/ingest-venv/bin/python"

default_args = {"retries": 1, "retry_delay": pendulum.duration(minutes=10)}

with DAG(
    dag_id="youtube_discovery",
    description="Weekly best-effort related-channel expansion (search.list, quota-heavy)",
    schedule="@weekly",
    start_date=pendulum.datetime(2026, 6, 1, tz="UTC"),
    catchup=False,
    default_args=default_args,
    tags=["youtube", "ingest", "discovery"],
):
    discover_channels = BashOperator(
        task_id="discover_channels",
        bash_command=f"cd {PROJECT_DIR} && {PY} -m apps.ingest.refresh discovery --max-new 50",
    )
