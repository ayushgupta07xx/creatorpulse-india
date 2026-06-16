"""Topic modeling over creator content with BERTopic.

Derives data-driven topics (c-TF-IDF keyword sets) over the creator corpus and maps
each behavioural archetype to its dominant topic. Reuses the precomputed BGE-small
embeddings in ``marts.channel_embeddings`` — no re-embedding — so this is a cache read,
not a 12k-channel recompute.

Run (Postgres up; takes a few minutes — do NOT Ctrl+C the UMAP/HDBSCAN step):
    set -a; source .env; set +a
    python analysis/topic_modeling.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from bertopic import BERTopic

from apps.ml.features import get_engine

OUT = Path(__file__).resolve().parent / "output"
TEXT_CANDIDATES = ("title", "channel_title", "description", "channel_description")
EMBED_MODEL = "BAAI/bge-small-en-v1.5"


def _embeddings_to_matrix(series: pd.Series) -> np.ndarray:
    def parse(v: object) -> np.ndarray:
        if isinstance(v, str):
            return np.fromstring(v.strip("[]"), sep=",")
        return np.asarray(v, dtype=float)

    return np.vstack([parse(v) for v in series])


def main() -> None:
    eng = get_engine()

    channels = pd.read_sql("SELECT * FROM staging_dbt.stg_channels", eng)
    text_cols = [c for c in TEXT_CANDIDATES if c in channels.columns]
    if not text_cols:
        raise SystemExit(f"no text columns in stg_channels; columns are {list(channels.columns)}")
    channels["doc"] = channels[text_cols].fillna("").agg(" ".join, axis=1).str.strip()
    channels = channels.loc[channels["doc"].str.len() > 0, ["channel_id", "doc"]]

    emb = pd.read_sql("SELECT channel_id, embedding FROM marts.channel_embeddings", eng)
    df = channels.merge(emb, on="channel_id", how="inner")
    docs = df["doc"].tolist()
    matrix = _embeddings_to_matrix(df["embedding"])
    print(
        f"fitting BERTopic on {len(docs):,} channels (reusing {matrix.shape[1]}-dim embeddings)..."
    )

    topic_model = BERTopic(
        embedding_model=EMBED_MODEL,
        min_topic_size=50,
        calculate_probabilities=False,
        verbose=True,
    )
    topics, _ = topic_model.fit_transform(docs, embeddings=matrix)
    df["topic"] = topics

    info = topic_model.get_topic_info()
    print("\nTop topics (c-TF-IDF keywords):")
    print(info[["Topic", "Count", "Name"]].head(15).to_string(index=False))

    try:
        clusters = pd.read_sql("SELECT channel_id, archetype FROM marts.mart_creator_features", eng)
        mapped = df.merge(clusters, on="channel_id", how="left")
        dominant = (
            mapped.loc[mapped["topic"] != -1]
            .groupby("archetype")["topic"]
            .agg(lambda s: s.value_counts().idxmax())
        )
        print("\nDominant topic per archetype:")
        for archetype, topic in dominant.items():
            words = ", ".join(w for w, _ in topic_model.get_topic(topic)[:6])
            print(f"  {archetype}: topic {topic} -> {words}")
    except Exception as exc:  # noqa: BLE001 - archetype column optional; degrade gracefully
        print(f"(archetype mapping skipped: {exc})")

    OUT.mkdir(exist_ok=True)
    df[["channel_id", "topic"]].to_csv(OUT / "channel_topics.csv", index=False)
    info.to_csv(OUT / "topic_keywords.csv", index=False)
    print(f"\nwrote {OUT}/channel_topics.csv and topic_keywords.csv")


if __name__ == "__main__":
    main()
