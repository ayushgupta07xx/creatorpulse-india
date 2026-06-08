# Custom Airflow image: stock Airflow + an ISOLATED venv (/opt/ingest-venv) that
# holds only the slim ingest runtime. Project code is mounted at
# /opt/airflow/project and run with /opt/ingest-venv/bin/python, so project deps
# never touch Airflow's own env -- a full editable install would pull SQLAlchemy
# 2.0 + Alembic and collide with Airflow 2.9's pinned SQLAlchemy 1.4 ORM.
# See docs/decisions.md.
FROM apache/airflow:2.9.3-python3.11

USER root
RUN python -m venv /opt/ingest-venv \
 && /opt/ingest-venv/bin/pip install --no-cache-dir \
      "python-youtube>=0.9" "psycopg2-binary>=2.9" "python-dotenv>=1.0" \
 && chown -R airflow:0 /opt/ingest-venv
USER airflow
