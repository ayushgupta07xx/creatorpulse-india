"""MLflow setup helpers (local SQLite backend, repo-local artifact store)."""

from __future__ import annotations

from pathlib import Path

import mlflow

REPO_ROOT = Path(__file__).resolve().parents[2]


def setup_mlflow(experiment_name: str = "creatorpulse_fraud") -> str:
    """Point MLflow at a repo-local SQLite store and ensure the experiment exists.

    Tracking DB: ``<repo>/mlflow.db``; artifacts default to ``<cwd>/mlruns``.
    Both are gitignored — the training script is the source of record.
    """
    db_path = REPO_ROOT / "mlflow.db"
    mlflow.set_tracking_uri(f"sqlite:///{db_path}")
    mlflow.set_experiment(experiment_name)
    exp = mlflow.get_experiment_by_name(experiment_name)
    assert exp is not None  # set_experiment above guarantees existence
    return exp.experiment_id
