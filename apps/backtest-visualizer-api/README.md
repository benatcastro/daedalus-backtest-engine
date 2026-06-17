# backtest-visualizer-api

Legacy, self-contained tooling for parsing and plotting QuantConnect Lean
backtest output. It bundles a small FastAPI service plus a set of Python scripts
that render charts with Plotly. This predates [`backtest-backend`](../backtest-backend)
and is kept as a standalone reference/utility.

- **Language/stack:** Python 3.11+, FastAPI, Uvicorn, pandas, Plotly, PyYAML
- **Dependency manager:** [uv](https://docs.astral.sh/uv/) (via `@nxlv/python`)
- **Default port:** `8001`

## Layout

```
apps/backtest-visualizer-api/
├── backend/main.py        # small FastAPI app
├── main.py                # entrypoint for the visualizer/plotting flow
├── BacktestVisualizer.py  # plotting logic (Plotly)
├── BacktestChooseModes.py # backtest selection strategies
├── ConfigParser.py        # reads config.yml
├── SerieTypes.py          # series type definitions
├── config.yml             # paths & options (see below)
└── sample/                # example Lean backtest output
```

## Setup

From the **monorepo root**:

```bash
npx nx install backtest-visualizer-api      # uv sync -> .venv
```

Edit `config.yml` to point at your Lean strategies directory:

```yaml
strategy_directory: "/path/to/lean/strats"
backtest_folder: "backtests"
backtest_choose_mode: "most_recent"
```

## Run

```bash
# Run the FastAPI service (http://localhost:8001)
npx nx serve backtest-visualizer-api

# Or run the plotting/visualizer flow
npx nx visualize backtest-visualizer-api
```

## Nx targets

| Target | Command it runs | Purpose |
|--------|-----------------|---------|
| `install` | `uv sync` | Create/refresh the virtualenv |
| `lock` | `uv lock` | Resolve & lock dependencies |
| `serve` | `uv run uvicorn main:app --app-dir backend …` | Start the API on `:8001` |
| `visualize` | `uv run python main.py` | Run the plotting flow |

## Environment & API keys

No API keys are required. Configuration is file-based via `config.yml`
(paths to your local Lean strategy/backtest folders). It does not depend on the
root `.env`.
