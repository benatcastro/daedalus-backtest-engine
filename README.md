# Daedalus Backtest Engine

> Architect of bots — a web application for analyzing and visualizing algorithmic trading strategy backtests.

Daedalus lets quantitative traders, researchers, and developers upload, parse, and review backtest results from algorithmic trading engines (with [QuantConnect Lean](https://www.lean.io/) as the initial focus). It turns raw backtest output into interactive dashboards, charts, and trade tables so strategies can be explored, compared, and shared.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & configure environment](#1-clone--configure-environment)
  - [2. Start the databases (Docker)](#2-start-the-databases-docker)
  - [3. Run the FastAPI backend](#3-run-the-fastapi-backend)
  - [4. Run the Next.js frontend](#4-run-the-nextjs-frontend)
- [Loading a Sample Backtest](#loading-a-sample-backtest)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Development Workflow](#development-workflow)
- [Project Conventions](#project-conventions)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Architecture

The system is split into three independently runnable pieces:

```
                ┌─────────────────────────┐
                │   Next.js frontend +     │   Auth, users, dashboards,
                │   API routes (port 3000) │   interactive charts/tables
                └───────────┬─────────────┘
                            │ REST
                ┌───────────▼─────────────┐
                │   FastAPI backend        │   Ingests, parses & analyzes
                │   (port 8000)            │   backtest results; serves analytics
                └───────────┬─────────────┘
                            │ SQLAlchemy
        ┌───────────────────┴───────────────────┐
        │                                        │
┌───────▼────────┐                      ┌────────▼────────┐
│ Postgres        │  backtest data       │ Postgres         │  users / auth
│ (port 5432)     │                      │ (port 5433)      │
└─────────────────┘                      └──────────────────┘
```

- **FastAPI backend** (`backtest-backend/`) — ingests, parses, and analyzes backtest result files, exposing a REST API for backtest data and analytics. Designed to be extensible to multiple engines; Lean is the first supported engine.
- **Next.js app** (`frontend/`) — handles user accounts and authentication (NextAuth + Google OAuth) via its own API routes and database, and renders the visualization UI.
- **PostgreSQL + pgAdmin** (`docker/`) — two Postgres databases (one for backtest data, one for app/auth data) plus pgAdmin, all managed with Docker Compose.

## Tech Stack

| Layer       | Technologies |
|-------------|--------------|
| Backend     | Python, FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn, pandas, `quantconnect-stubs` |
| Frontend    | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Prisma, NextAuth, lightweight-charts, Recharts, SWR |
| Database    | PostgreSQL (×2), pgAdmin |
| Tooling     | Docker Compose, Ruff (Python lint), Prettier/ESLint (frontend) |

## Repository Layout

```
daedalus-backtest-engine/
├── backtest-backend/        # FastAPI service
│   ├── src/
│   │   ├── main.py          # App entrypoint
│   │   ├── config.py        # Settings (loaded from root .env)
│   │   ├── database.py      # SQLAlchemy engine/session
│   │   ├── backtest/        # Backtest domain: router, models, schemas, engine
│   │   │   └── lean/        # Lean-engine-specific parsing & saving
│   │   └── alembic/         # Database migrations
│   ├── requirements/
│   └── sample/              # Example Lean backtest output files
├── frontend/                # Next.js app (UI + auth API routes)
│   ├── src/
│   ├── prisma/              # Prisma schema & migrations
│   └── package.json
├── docker/                  # docker-compose for Postgres + pgAdmin
├── docs/                    # Additional documentation
├── scripts/                 # Helper scripts
├── .env.example             # Template for the shared root .env
└── .nvmrc                   # Node version (v22.17.1)
```

## Prerequisites

- **Docker** & **Docker Compose** (for the databases)
- **Python 3.11+** (for the backend)
- **Node.js v22.17.1** (see `.nvmrc`; `nvm use` will pick it up) and **npm**

## Getting Started

All three services read configuration from a **single shared `.env` file at the repository root**.

### 1. Clone & configure environment

```bash
git clone https://github.com/benatcastro/daedalus-backtest-engine.git
cd daedalus-backtest-engine
cp .env.example .env
# Edit .env and fill in database credentials, OAuth secrets, and URLs
```

See [Environment Variables](#environment-variables) for what each value means.

### 2. Start the databases (Docker)

```bash
cd docker
docker compose up -d
```

This starts:

| Service              | Description                  | Default Port |
|----------------------|------------------------------|--------------|
| `postgres-backtests` | Backtest data (FastAPI)      | 5432         |
| `postgres-nextjs`    | User/auth data (Next.js)     | 5433         |
| `pgadmin`            | DB admin UI                  | 5050         |

pgAdmin is available at <http://localhost:5050> (credentials come from `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`). See `docker/README.md` for more details.

### 3. Run the FastAPI backend

```bash
cd backtest-backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements/requirements.txt

# Run the API (tables are auto-created on startup)
cd src
uvicorn main:app --reload --port 8000
```

The API will be available at <http://localhost:8000>, with interactive docs at <http://localhost:8000/docs>.

### 4. Run the Next.js frontend

```bash
cd frontend
nvm use                 # selects Node v22.17.1 from .nvmrc
npm install

# Sync the Prisma schema / generate the client (uses the root .env)
npm run prisma:generate
npm run prisma:migrate:dev

npm run dev
```

The app will be available at <http://localhost:3000>.

## Loading a Sample Backtest

The repo ships with example Lean backtest output in `backtest-backend/sample/`. Once the backend is running, you can upload it via the API. `scripts/create_sample_backtest.sh` shows the exact `curl` request (update the absolute file paths to match your checkout):

```bash
curl -X POST http://localhost:8000/api/v1/backtest/ \
  -F "engine=LEAN" \
  -F "strategy_id=1" \
  -F "name=Lean Backtest Upload Test" \
  -F "description=Testing upload with sample files" \
  -F "files=@backtest-backend/sample/1217966458-summary.json" \
  -F "files=@backtest-backend/sample/1217966458-order-events.json" \
  -F "files=@backtest-backend/sample/1217966458.json" \
  -H "Accept: application/json"
```

You can then explore the parsed result in the frontend or browse the data in pgAdmin.

## Environment Variables

The root `.env` (copied from `.env.example`) is consumed by the backend, the frontend, and Docker Compose. Key groups:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_NEXT_API_URL` | Public URL of the Next.js app |
| `NEXT_PUBLIC_BACKTEST_BACKEND_URL` | Public URL of the FastAPI backend |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins for the backend |
| `BACKTEST_DATABASE_URL` | SQLAlchemy connection string for the backtest DB |
| `NEXT_DATABASE_URL` | Prisma connection string for the user/auth DB |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials for NextAuth |
| `BACKTEST_DB_*` / `NEXTAUTH_DB_*` | Per-database host/port/name/user/password used by Docker Compose |
| `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` | pgAdmin login |

> **Security:** Never commit your real `.env`. Change all default passwords and secrets before deploying anywhere non-local, and prefer a secrets manager in production.

## Database Migrations

**Backend (Alembic):**

```bash
cd backtest-backend/src
alembic upgrade head                       # apply latest migrations
alembic revision --autogenerate -m "msg"   # create a new migration
```

**Frontend (Prisma):** convenience scripts are defined in `frontend/package.json`:

```bash
npm run prisma:migrate:dev      # create & apply a dev migration
npm run prisma:migrate:deploy   # apply migrations (deploy)
npm run prisma:studio           # open Prisma Studio
npm run prisma:migrate:status   # check migration state
```

## Development Workflow

- **Branching:** feature branches are derived from `dev`. CI is configured under `.github/workflows/` (including code-quality checks and automated branch creation from issues).
- **Issues & PRs:** issue templates live in `.github/ISSUE_TEMPLATE/`, and PR templates (feature/bugfix/chore/docs/security) live in `.github/PULL_REQUEST_TEMPLATE/`.
- **Contributor guidance:** coding standards and domain context are documented in `.github/instructions/` (`general`, `backend`, `frontend`, and `backtest-visualization`). Read these before contributing.

## Project Conventions

- **Linting/formatting:** Python uses [Ruff](https://docs.astral.sh/ruff/) (`backtest-backend/ruff.toml`); the frontend uses Prettier and ESLint (`npm run style:check` / `npm run lint`).
- **Secrets:** all API keys, URLs, and credentials must come from the `.env` file — never hardcode them.
- **Extensibility:** the backend abstracts engines behind factories (`DataHandlerFactory`, `BacktestSaverFactory`) so additional backtest engines can be added alongside Lean.

## Troubleshooting

- **Port conflicts (5432/5433/5050):** change the host ports in `docker/docker-compose.yml` and update the matching `.env` values.
- **Backend can't connect to the DB:** confirm the Docker containers are healthy (`docker compose ps`) and that `BACKTEST_DATABASE_URL` points to the right host/port.
- **Frontend env not loading:** the frontend loads the **root** `.env` (one directory up). Make sure it exists and is populated.
- **Node version errors:** run `nvm use` to match `.nvmrc` (v22.17.1).

## License

See [LICENSE](LICENSE).
