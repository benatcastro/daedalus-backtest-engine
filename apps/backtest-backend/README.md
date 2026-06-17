# backtest-backend

FastAPI service that ingests, parses, and analyzes algorithmic-trading backtest
results (QuantConnect Lean as the first supported engine) and exposes them through
a REST API consumed by the [`frontend`](../frontend) web app.

- **Language/stack:** Python 3.11+, FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn
- **Dependency manager:** [uv](https://docs.astral.sh/uv/) (via `@nxlv/python`)
- **Default port:** `8000` — interactive docs at `/docs`

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) 0.8+
- A reachable PostgreSQL instance (use the repo's [Docker stack](../../docker))

## Setup

From the **monorepo root**:

```bash
# Install dependencies (creates apps/backtest-backend/.venv via uv)
npx nx install backtest-backend

# Make sure the root .env is configured (see "Environment" below)
cp .env.example .env   # if you haven't already

# Start the database, then apply migrations
cd docker && docker compose up -d && cd ..
npx nx migrate backtest-backend     # alembic upgrade head
```

## Run

```bash
npx nx serve backtest-backend       # uvicorn main:app --app-dir src --reload --port 8000
```

Then open:

- API root: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>

## Nx targets

| Target | Command it runs | Purpose |
|--------|-----------------|---------|
| `install` | `uv sync` | Create/refresh the virtualenv |
| `lock` | `uv lock` | Resolve & lock dependencies (`uv.lock`) |
| `serve` | `uv run uvicorn …` | Start the API with autoreload |
| `migrate` | `uv run alembic upgrade head` | Apply DB migrations |
| `lint` | `uv run ruff check .` | Lint |
| `format` | `uv run ruff format .` | Format |

### Database migrations (Alembic)

```bash
# create a new migration after changing the SQLAlchemy models
cd apps/backtest-backend && uv run alembic revision --autogenerate -m "message"
# apply migrations
npx nx migrate backtest-backend
```

## Environment

This service reads the **root `.env`** (resolved automatically by
`src/config.py`). Relevant variables:

| Variable | Description |
|----------|-------------|
| `BACKTEST_DATABASE_URL` | SQLAlchemy Postgres connection string |
| `BACKTEST_DB_HOST/PORT/NAME/USER/PASSWORD` | DB connection parts (also used by Docker) |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins |
| `NEXT_PUBLIC_NEXT_API_URL`, `NEXT_PUBLIC_BACKTEST_BACKEND_URL` | Service URLs |
| `LEAN_BASE_DATA_PATH` | (optional) path to your local Lean data directory |

**API keys:** none required by this service. It only needs database credentials.

## Sample data

`sample/` contains an example Lean backtest output. With the API running you can
upload it via the `POST /api/v1/backtest/` endpoint — see
[`scripts/create_sample_backtest.sh`](../../scripts/create_sample_backtest.sh)
for an example `curl` request (adjust the file paths to your checkout).
