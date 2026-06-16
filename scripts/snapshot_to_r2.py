"""Archive a warehouse snapshot to Cloudflare R2 as Parquet.

Reads a curated table from the warehouse and writes a date-partitioned Parquet object
to the R2 bucket (S3-compatible, via boto3). Credentials and bucket name come from the
environment — never hard-coded:

    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
    R2_BUCKET            (naming convention: portfolio-creatorpulse-<env>)

Run (Postgres up, R2 env set):
    set -a; source .env; set +a
    python scripts/snapshot_to_r2.py
"""

from __future__ import annotations

import os
from datetime import UTC, date, datetime
from io import BytesIO

import boto3
import pandas as pd

from apps.ml.features import get_engine

TABLE = "marts.mart_creator_features"


def _r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def main() -> None:
    eng = get_engine()
    df = pd.read_sql(f"SELECT * FROM {TABLE}", eng)

    buf = BytesIO()
    df.to_parquet(buf, index=False, compression="snappy")
    size_mb = buf.getbuffer().nbytes / 1e6
    buf.seek(0)

    snapshot = date.today().isoformat()
    table_name = TABLE.split(".")[-1]
    key = f"raw/{table_name}/snapshot_date={snapshot}/data.parquet"
    bucket = os.environ["R2_BUCKET"]

    _r2_client().put_object(
        Bucket=bucket,
        Key=key,
        Body=buf.getvalue(),
        Metadata={
            "rows": str(len(df)),
            "archived_at": datetime.now(UTC).isoformat(),
        },
    )
    print(f"uploaded {len(df):,} rows -> s3://{bucket}/{key} ({size_mb:.1f} MB parquet)")


if __name__ == "__main__":
    main()
