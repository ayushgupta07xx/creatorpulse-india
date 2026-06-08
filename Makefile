.PHONY: install up up-airflow down fmt lint seed test

install:
	python -m venv .venv && . .venv/bin/activate && pip install -U pip && pip install -e ".[dev]"

up:            ## start postgres only (light: Day 1-2)
	docker compose up -d postgres

up-airflow:    ## start full stack incl. airflow (Day 3+)
	docker compose --profile airflow up -d

down:
	docker compose --profile airflow down

fmt:
	ruff check --fix . && ruff format .

lint:
	ruff check . && mypy apps scripts

seed:
	python scripts/build_seed_list.py

test:
	pytest -q
