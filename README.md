# Daedalus

> Architect of bots — an [Nx](https://nx.dev) monorepo of algorithmic-trading tools for building, backtesting, visualizing, and feeding data to trading strategies.

Daedalus is a polyglot monorepo. A single workspace hosts TypeScript/Next.js
web apps, Python/FastAPI services, and Rust binaries, all driven through a
consistent set of `nx` commands. The flagship product is a web application for
**analyzing and visualizing algorithmic-trading strategy backtests** (with
[QuantConnect Lean](https://www.lean.io/) as the first supported engine), plus
supporting tools for fetching market data and managing financial datasets.

---

## Table of Contents

- [Applications](#applications)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Working with Nx](#working-with-nx)
- [Environment & API Keys](#environment--api-keys)
- [Per-App Documentation](#per-app-documentation)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Applications

Every project lives under [`apps/`](apps/) and has its own README with detailed
setup and run instructions.

| App | Path | Language / Stack | What it does |
|-----|------|------------------|--------------|
| **frontend** | [`apps/frontend`](apps/frontend) | TypeScript · Next.js 16 · React 19 · Prisma · NextAuth | Main web UI: auth, dashboards, interactive backtest charts & tables |
| **backtest-backend** | [`apps/backtest-backend`](apps/backtest-backend) | Python · FastAPI · SQLAlchemy · Alembic | Ingests, parses & analyzes backtest results; serves the analytics REST API |
| **backtest-visualizer-web** | [`apps/backtest-visualizer-web`](apps/backtest-visualizer-web) | TypeScript · Next.js 16 | Lightweight standalone candlestick/chart prototype |
| **backtest-visualizer-api** | [`apps/backtest-visualizer-api`](apps/backtest-visualizer-api) | Python · FastAPI · Plotly | Legacy backtest parsing/plotting tools + a small API |
| **data-downloader** | [`apps/data-downloader`](apps/data-downloader) | Python · ccxt | Fetches OHLCV market data into the Lean data folder |
| **fin-data-manager** | [`apps/fin-data-manager`](apps/fin-data-manager) | Rust · actix-web | Financial data management service (early scaffold) |

### How they fit together

```
                ┌──────────────────────────────┐
                │  frontend (Next.js, :3000)    │  auth, dashboards, charts
                └───────────────┬──────────────┘
                                │ REST
                ┌───────────────▼──────────────┐
                │  backtest-backend (FastAPI,   │  ingest / parse / analyze
                │  :8000)                       │  backtest results
                └───────────────┬──────────────┘
                                │ SQLAlchemy
        ┌───────────────────────┴───────────────────────┐
 ┌──────▼───────┐                                 ┌───────▼───────┐
 │ Postgres     │  backtest data (:5432)          │ Postgres      │ users/auth (:5433)
 └──────────────┘                                 └───────────────┘

  Supporting tools:
   • data-downloader (Python/ccxt)      → fills the Lean data folder
   • backtest-visualizer-{web,api}      → standalone visualization prototype
   • fin-data-manager (Rust)            → financial data service (WIP)
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Monorepo | Nx 22, npm workspaces |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Prisma, NextAuth, lightweight-charts, Recharts, SWR |
| Python services | FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn, pandas, Plotly, ccxt — managed with [uv](https://docs.astral.sh/uv/) via [`@nxlv/python`](https://github.com/lucasvieirasilva/nx-plugins) |
| Rust | Cargo workspace, actix-web — wired with [`@monodon/rust`](https://github.com/Cammisuli/monodon) |
| Database | PostgreSQL ×2, pgAdmin (Docker Compose) |

## Repository Layout

```
daedalus/
├── apps/
│   ├── frontend/                 # Next.js web app (UI + auth API routes)
│   ├── backtest-backend/         # FastAPI backtest ingestion & analytics API
│   ├── backtest-visualizer-web/  # Next.js chart prototype
│   ├── backtest-visualizer-api/  # Legacy Python visualizer/plotting tools
│   ├── data-downloader/          # ccxt market-data downloader
│   └── fin-data-manager/         # Rust (actix-web) service
├── docker/                       # Postgres + pgAdmin (docker-compose)
├── docs/                         # Additional documentation
├── scripts/                      # Helper scripts
├── nx.json                       # Nx configuration
├── package.json                  # Workspace root (Nx + JS deps)
├── Cargo.toml                    # Rust workspace
├── .env.example                  # Shared root environment template
└── .nvmrc                        # Node version (v22.17.1)
```

## Prerequisites

| Tool | Version | Used by |
|------|---------|---------|
| [Node.js](https://nodejs.org) | v22.17.1 (see `.nvmrc`; `nvm use`) | Nx, the Next.js apps |
| npm | 10+ | workspace install |
| [uv](https://docs.astral.sh/uv/) | 0.8+ | the Python apps (`@nxlv/python`) |
| [Rust](https://rustup.rs/) (cargo) | 1.94+ (edition 2024) | `fin-data-manager` |
| [Docker](https://www.docker.com/) + Compose | recent | local Postgres + pgAdmin |

> You only need the toolchains for the apps you intend to run. Nx itself only
> needs Node + npm.

## Quick Start

```bash
# 1. Clone and install JS/Nx dependencies (npm workspaces)
git clone https://github.com/benatcastro/daedalus-backtest-engine.git daedalus
cd daedalus
nvm use            # selects Node v22.17.1
npm install        # installs Nx, plugins, and both Next.js apps

# 2. Configure environment (see "Environment & API Keys" below)
cp .env.example .env
#   …then edit .env with DB credentials, NextAuth secret, Google OAuth keys

# 3. Start the databases
cd docker && docker compose up -d && cd ..

# 4. Generate the Prisma client & apply migrations for the web app
npx nx prisma-generate frontend
cd apps/frontend && npm run prisma:migrate:deploy && cd ../..

# 5. Run the apps you need (each in its own terminal)
npx nx dev frontend            # http://localhost:3000
npx nx serve backtest-backend  # http://localhost:8000  (docs at /docs)
```

## Working with Nx

All projects are driven through `nx <target> <project>`. Common targets:

| Command | Description |
|---------|-------------|
| `npx nx show projects` | List all projects in the workspace |
| `npx nx graph` | Open the interactive project graph |
| `npx nx <target> <project>` | Run a single target (e.g. `nx build frontend`) |
| `npx nx run-many -t build` | Build everything that has a `build` target |
| `npx nx run-many -t lint` | Lint across projects |

### Targets by project

| Project | Targets |
|---------|---------|
| `frontend` | `build`, `dev`, `start`, `lint`, `prisma-generate` |
| `backtest-visualizer-web` | `build`, `dev`, `start`, `lint` |
| `backtest-backend` | `install`, `lock`, `serve`, `migrate`, `lint`, `format` |
| `backtest-visualizer-api` | `install`, `lock`, `serve`, `visualize` |
| `data-downloader` | `install`, `lock`, `run` |
| `fin-data-manager` | `build`, `run`, `check`, `test`, `lint` |

Examples:

```bash
npx nx build fin-data-manager     # cargo build -> dist/target/debug
npx nx install backtest-backend   # uv sync (create the app's venv)
npx nx serve backtest-backend     # uvicorn on :8000
npx nx run data-downloader        # run the ccxt downloader
```

### Polyglot notes

- **Python** apps are real [uv](https://docs.astral.sh/uv/) projects. `nx install`
  runs `uv sync` and creates a per-app `.venv`; `nx serve`/`run` use `uv run`.
  Each app keeps a committed `uv.lock` for reproducibility.
- **Rust** is a Cargo workspace rooted at `Cargo.toml`; build artifacts go to
  `dist/target` (configured in `.cargo/config.toml`).
- **Next.js** apps share a single hoisted `node_modules` via npm workspaces.

## Environment & API Keys

All web/back-end services read from a **single `.env` at the repository root**
(`cp .env.example .env`). The most important values:

| Variable | Needed by | How to obtain |
|----------|-----------|---------------|
| `BACKTEST_DATABASE_URL`, `BACKTEST_DB_*` | backtest-backend, Docker | choose your own Postgres credentials |
| `NEXT_DATABASE_URL`, `NEXTAUTH_DB_*` | frontend, Docker | choose your own Postgres credentials |
| `NEXTAUTH_SECRET` | frontend (NextAuth) | generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | frontend | usually `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | frontend (Google sign-in) | [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials); redirect URI `http://localhost:3000/api/auth/callback/google` |
| `CORS_ORIGINS` | backtest-backend | comma-separated allowed origins |
| `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` | Docker pgAdmin | choose your own |

The `data-downloader` tool has its own optional `apps/data-downloader/.env.example`
(exchange API keys are only required for authenticated/private endpoints — public
candle data needs none).

> **Never commit your real `.env`.** Both root and per-app `.env` files are gitignored.

## Per-App Documentation

Each app's README covers setup, how to run it, and the env/API keys it needs:

- [apps/frontend/README.md](apps/frontend/README.md)
- [apps/backtest-backend/README.md](apps/backtest-backend/README.md)
- [apps/backtest-visualizer-web/README.md](apps/backtest-visualizer-web/README.md)
- [apps/backtest-visualizer-api/README.md](apps/backtest-visualizer-api/README.md)
- [apps/data-downloader/README.md](apps/data-downloader/README.md)
- [apps/fin-data-manager/README.md](apps/fin-data-manager/README.md)
- [docker/README.md](docker/README.md) — database stack

## Troubleshooting

- **`nx: command not found`** — run via `npx nx …`, or `npm install` first.
- **Port conflicts (3000/8000/5432/5433/5050)** — change the host ports in
  `docker/docker-compose.yml` / the relevant `.env` values and app commands.
- **`uv: command not found`** — install uv (`curl -LsSf https://astral.sh/uv/install.sh | sh`).
- **Rust build fails** — ensure `cargo` ≥ 1.94 (edition 2024); `rustup update`.
- **Frontend env not loading** — the Next.js apps load the **root** `.env`; make
  sure it exists and is populated, then re-run `npx nx prisma-generate frontend`.
- **Nx cache acting up** — `npx nx reset` clears the local cache.

## License

See [LICENSE](LICENSE).
