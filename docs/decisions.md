# Architecture Decision Records

## ADR-0001 — PEP 621 pyproject + pip editable install (not poetry)
**Decision:** Use a PEP 621 `pyproject.toml` with the hatchling backend and `pip install -e ".[dev]"` for installs.
**Why:** Matches the standing local convention (`.venv` per project root, editable installs) used across the other repos, keeping tooling identical project-to-project. A PEP 621 file is still poetry-readable if needed later. Heavy ML/app/warehouse deps are isolated in optional-dependency groups so Day 1-2 installs stay light.

## ADR-0002 — PostHog Cloud, not self-hosted
**Decision:** Use PostHog Cloud free tier (1M events/month) for all product analytics; do not self-host PostHog in docker compose.
**Why:** Free tier covers portfolio-scale traffic comfortably, and self-hosting PostHog adds ~6 heavy containers with no benefit. Keeps the local stack to Postgres (+ optional Airflow).

## ADR-0003 — Remapped host ports to coexist with concurrent host projects
**Decision:** Publish Postgres on host `5436` and Airflow webserver on host `8088`.
**Why:** This host runs other projects concurrently (e.g. a kind/k8s cluster on `8080`, other Postgres instances on `5432-5435`). Remap our ports rather than freeing theirs; never reconfigure another project's containers.

## ADR-0004 — Pre-commit hooks pinned to the venv toolchain
**Decision:** Run ruff, ruff-format, mypy, and sqlfluff as `repo: local` / `language: system` hooks invoking the venv's installed tools; pin `ruff==0.6.9` in `[dev]` to match.
**Why:** A version gap between a pinned pre-commit rev and the venv's ruff makes the hook re-fix files on commit and abort, costing a re-stage every commit. Calling the venv tools directly keeps hook == local fixer.

## ADR-0005 — YouTube Data API v3 only for v1; Instagram is v2 future work
**Decision:** v1 ingests only via the official YouTube Data API v3. Instagram (and X, Twitch, etc.) are scoped out behind an abstract `CreatorSource` interface.
**Why:** YouTube has a free, documented API with predictable quotas. Instagram has no equivalent public API; the alternatives are TOS-restricted scraping or paid services. Scoping to YouTube keeps v1 legally clean and fully reproducible.
