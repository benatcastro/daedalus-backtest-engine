# data-downloader

A small Python tool that fetches OHLCV (candle) market data via
[ccxt](https://github.com/ccxt/ccxt) and writes it into the
[QuantConnect Lean](https://www.lean.io/) data-folder layout
(`<security_type>/<market>/<resolution>/<ticker>`).

- **Language/stack:** Python 3.11+, ccxt
- **Dependency manager:** [uv](https://docs.astral.sh/uv/) (via `@nxlv/python`)

## Setup

From the **monorepo root**:

```bash
npx nx install data-downloader      # uv sync -> .venv
```

Optionally configure the output directory and (only for private endpoints)
exchange API keys:

```bash
cp apps/data-downloader/.env.example apps/data-downloader/.env
# edit LEAN_DATA_FOLDER and, if needed, exchange API keys
```

## Run

```bash
npx nx run data-downloader          # uv run python main.py
```

By default `main.py` fetches a sample of `ETH/USDT` daily candles from Binance
and prints them. Adjust `main.py` to choose markets, tickers, and resolutions
(`Markets.py`, `Resolutions.py`, `SecurityTypes.py` define the available enums).

## Nx targets

| Target | Command it runs | Purpose |
|--------|-----------------|---------|
| `install` | `uv sync` | Create/refresh the virtualenv |
| `lock` | `uv lock` | Resolve & lock dependencies |
| `run` | `uv run python main.py` | Run the downloader |

## Environment & API keys

| Variable | Required? | Description |
|----------|-----------|-------------|
| `LEAN_DATA_FOLDER` | optional | Output root (defaults to `$HOME/Workspace/algotrading/lean/data`) |
| `BINANCE_API_KEY` / `BINANCE_API_SECRET` | optional | Only needed for **authenticated/private** exchange endpoints. Public candle data requires no keys. |

Get exchange API keys from your exchange's API management page (e.g.
Binance → *API Management*). See [`.env.example`](.env.example).
