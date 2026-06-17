# backtest-visualizer-web

A lightweight, standalone Next.js prototype that renders candlestick charts with
[lightweight-charts](https://github.com/tradingview/lightweight-charts). It was
imported as an early visualization experiment and pairs with
[`backtest-visualizer-api`](../backtest-visualizer-api).

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
  lightweight-charts
- **Default port:** `3000`

## Prerequisites

- Node.js v22.17.1 (`nvm use` from the repo root) + npm
- Dependencies installed from the **monorepo root** (`npm install`)

## Run

```bash
npx nx dev backtest-visualizer-web        # http://localhost:3000
npx nx build backtest-visualizer-web      # production build
npx nx start backtest-visualizer-web      # serve the production build
npx nx lint backtest-visualizer-web       # eslint
```

The chart page (`/backtest`) fetches candle data from a backend URL hardcoded in
`src/app/backtest/page.tsx`; point it at a running data source as needed.

## Nx targets

| Target | Description |
|--------|-------------|
| `dev` | `next dev --turbopack` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |

## Environment & API keys

None required. This is a self-contained prototype with no auth or database.

## Notes

This app is an early prototype: its chart demo code predates a clean production
build, so `next.config.ts` sets `typescript.ignoreBuildErrors` so it can be wired
into the monorepo. Run `npx tsc --noEmit` to see the outstanding type issues and
clean them up when revisiting the demo.
