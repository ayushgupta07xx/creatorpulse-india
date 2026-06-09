"""Engagement-fraud classifier: XGBoost (primary) + LightGBM baseline.

Pipeline: build the simulated cohort -> heuristic labels (with a calibrated
disagreement rate so the model can't trivially memorise the rule boundary) ->
Optuna-tuned XGBoost (5-fold CV, F1) -> LightGBM baseline -> IsolationForest
anomaly comparison -> SHAP interpretability -> MLflow logging -> persist model,
baseline metrics and ground-truth labels.

The training cohort is SIMULATED (see features.py). Reported metrics are
"validated against a simulated cohort", not observed fraud.

Run:  python -m apps.ml.fraud_classifier
"""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime

import joblib
import lightgbm as lgb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import mlflow  # noqa: E402
import numpy as np  # noqa: E402
import optuna  # noqa: E402
import pandas as pd  # noqa: E402
import shap  # noqa: E402
import xgboost as xgb  # noqa: E402
from sklearn.ensemble import IsolationForest  # noqa: E402
from sklearn.metrics import (  # noqa: E402
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (  # noqa: E402
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)

from apps.ml.features import (  # noqa: E402
    FEATURE_COLUMNS,
    extract_real_features,
    get_engine,
    heuristic_label,
    simulate_cohort,
)
from apps.ml.mlflow_utils import REPO_ROOT, setup_mlflow  # noqa: E402

# Calibration constants (reproducible; see Day-5 dry run).
LABEL_DISAGREEMENT = 0.12  # heuristic rules are imperfect proxies (spec section 12)
FEATURE_NOISE = 0.30  # observed metrics are noisy estimates of true behaviour
COHORT_N = 200
SEED = 42

MODEL_PATH = REPO_ROOT / "models" / "fraud_classifier_v1.joblib"
BASELINE_PATH = REPO_ROOT / "evaluation" / "baselines" / "fraud_classifier.json"
LABELS_PATH = REPO_ROOT / "evaluation" / "ground_truth_labels.csv"
SHAP_PATH = REPO_ROOT / "docs" / "images" / "shap_fraud_summary.png"


def build_dataset() -> tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """Simulated cohort -> noisy heuristic labels -> noisy observed features."""
    engine = get_engine()
    real = extract_real_features(engine)
    cohort = simulate_cohort(real, n=COHORT_N, seed=SEED)

    y = heuristic_label(cohort)
    flip_rng = np.random.default_rng(13)
    flip = flip_rng.random(len(y)) < LABEL_DISAGREEMENT
    y = y.copy()
    y[flip] = 1 - y[flip]

    x_clean = cohort[FEATURE_COLUMNS].to_numpy(dtype=float)
    noise_rng = np.random.default_rng(7)
    col_sd = np.nanstd(x_clean, axis=0)
    x_obs = x_clean + noise_rng.normal(0, FEATURE_NOISE * col_sd, x_clean.shape)

    labels = pd.DataFrame(
        {
            "channel_id": cohort["channel_id"],
            "label": y,
            "heuristic_disagreement": flip,
            "is_simulated": True,
        }
    )
    return x_obs, y, labels


def tune_xgb(x_tr: np.ndarray, y_tr: np.ndarray, n_trials: int) -> tuple[dict, float]:
    """Optuna search over XGBoost, maximising 5-fold CV F1."""
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    skf = StratifiedKFold(5, shuffle=True, random_state=SEED)

    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 500),
            "max_depth": trial.suggest_int("max_depth", 2, 6),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 8),
            "gamma": trial.suggest_float("gamma", 0.0, 5.0),
            "reg_lambda": trial.suggest_float("reg_lambda", 0.5, 5.0),
            "eval_metric": "logloss",
            "tree_method": "hist",
            "random_state": SEED,
        }
        model = xgb.XGBClassifier(**params)
        return cross_val_score(model, x_tr, y_tr, cv=skf, scoring="f1").mean()

    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=SEED))
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
    return study.best_params, float(study.best_value)


def save_shap(model: xgb.XGBClassifier, x_tr: np.ndarray) -> dict:
    """SHAP summary plot + mean |SHAP| per feature."""
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(x_tr)
    mean_abs = np.abs(shap_values).mean(axis=0)
    importance = dict(
        sorted(
            zip(FEATURE_COLUMNS, mean_abs.tolist(), strict=False),
            key=lambda kv: kv[1],
            reverse=True,
        )
    )
    SHAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    shap.summary_plot(shap_values, x_tr, feature_names=FEATURE_COLUMNS, plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(SHAP_PATH, dpi=120, bbox_inches="tight")
    plt.close()
    return importance


def main(n_trials: int = 50) -> None:
    x, y, labels = build_dataset()
    pos_rate = float(y.mean())
    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.2, stratify=y, random_state=SEED)

    setup_mlflow("creatorpulse_fraud")
    with mlflow.start_run(run_name="xgb_fraud_v1"):
        best_params, cv_f1 = tune_xgb(x_tr, y_tr, n_trials)

        xgb_model = xgb.XGBClassifier(
            **best_params, eval_metric="logloss", tree_method="hist", random_state=SEED
        )
        xgb_model.fit(x_tr, y_tr)
        xgb_pred = xgb_model.predict(x_te)
        xgb_proba = xgb_model.predict_proba(x_te)[:, 1]
        holdout_f1 = float(f1_score(y_te, xgb_pred))
        auc = float(roc_auc_score(y_te, xgb_proba))
        precision = float(precision_score(y_te, xgb_pred, zero_division=0))
        recall = float(recall_score(y_te, xgb_pred, zero_division=0))
        cm = confusion_matrix(y_te, xgb_pred).tolist()

        # LightGBM baseline (single run, defaults) — "I evaluated multiple frameworks"
        lgb_model = lgb.LGBMClassifier(random_state=SEED, verbose=-1)
        lgb_model.fit(x_tr, y_tr)
        lgb_f1 = float(f1_score(y_te, lgb_model.predict(x_te)))

        # IsolationForest unsupervised anomaly comparison
        iso = IsolationForest(random_state=SEED, contamination=pos_rate)
        iso.fit(x_tr)
        iso_pred = (iso.predict(x_te) == -1).astype(int)
        iso_f1 = float(f1_score(y_te, iso_pred, zero_division=0))

        importance = save_shap(xgb_model, x_tr)

        mlflow.log_params(best_params)
        mlflow.log_params(
            {
                "cohort_n": COHORT_N,
                "label_disagreement": LABEL_DISAGREEMENT,
                "feature_noise": FEATURE_NOISE,
                "is_simulated": True,
            }
        )
        mlflow.log_metrics(
            {
                "cv_f1": cv_f1,
                "holdout_f1": holdout_f1,
                "auc": auc,
                "precision": precision,
                "recall": recall,
                "lightgbm_f1": lgb_f1,
                "isolationforest_f1": iso_f1,
                "positive_rate": pos_rate,
            }
        )
        mlflow.set_tag("model_type", "xgboost")
        mlflow.set_tag("cohort", "simulated")
        mlflow.sklearn.log_model(xgb_model, name="model")

    # ---- persist artifacts ----
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": xgb_model,
            "feature_columns": FEATURE_COLUMNS,
            "metadata": {
                "trained_at": datetime.now(UTC).isoformat(),
                "cohort": "simulated",
                "cohort_n": COHORT_N,
                "cv_f1": cv_f1,
                "holdout_f1": holdout_f1,
                "auc": auc,
            },
        },
        MODEL_PATH,
    )

    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    baseline = {
        "model": "xgboost_fraud_v1",
        "cohort": "simulated",
        "cohort_n": COHORT_N,
        "positive_rate": round(pos_rate, 4),
        "cv_f1": round(cv_f1, 4),
        "holdout_f1": round(holdout_f1, 4),
        "auc": round(auc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "confusion_matrix": cm,
        "lightgbm_baseline_f1": round(lgb_f1, 4),
        "isolationforest_f1": round(iso_f1, 4),
        "best_params": best_params,
        "feature_importance_mean_abs_shap": {k: round(v, 5) for k, v in importance.items()},
        "label_disagreement": LABEL_DISAGREEMENT,
        "feature_noise": FEATURE_NOISE,
        "created_at": datetime.now(UTC).isoformat(),
    }
    BASELINE_PATH.write_text(json.dumps(baseline, indent=2))
    labels.to_csv(LABELS_PATH, index=False)

    print(f"cohort n={COHORT_N}  positive_rate={pos_rate:.3f}  (SIMULATED)")
    print(f"PRIMARY 5-fold CV F1 = {cv_f1:.4f}   (spec target >= 0.75)")
    print(f"held-out F1 = {holdout_f1:.4f}  AUC = {auc:.4f}  P = {precision:.3f}  R = {recall:.3f}")
    print(f"LightGBM baseline F1 = {lgb_f1:.4f}   IsolationForest F1 = {iso_f1:.4f}")
    print(f"top features: {list(importance)[:5]}")
    print(f"saved: {MODEL_PATH.name}, {BASELINE_PATH.name}, {LABELS_PATH.name}, {SHAP_PATH.name}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--trials", type=int, default=50)
    main(ap.parse_args().trials)
