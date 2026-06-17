# frontend

The main Daedalus web application: user authentication, dashboards, and
interactive visualizations of backtest results. It talks to the
[`backtest-backend`](../backtest-backend) FastAPI service for analytics data and
uses its own database for users/auth.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
  Radix UI, Prisma, NextAuth (Google OAuth), lightweight-charts, Recharts, SWR
- **Default port:** `3000`

## Prerequisites

- Node.js v22.17.1 (`nvm use` from the repo root) + npm
- A reachable PostgreSQL instance for the user/auth DB (use the repo's
  [Docker stack](../../docker))
- Dependencies installed from the **monorepo root** (`npm install`) — this app
  shares the workspace `node_modules`.

## Environment

This app loads the **monorepo root `.env`** (via `next.config.ts` and, for
Prisma scripts, `dotenv-cli`). Copy and fill it in from the root:

```bash
cp ../../.env.example ../../.env
```

Variables this app uses:

| Variable                                    | Description                                              | How to obtain                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_DATABASE_URL`                         | Postgres connection string for the user/auth DB (Prisma) | your DB credentials                                                                                                                                                                |
| `NEXTAUTH_SECRET`                           | Session/JWT encryption secret                            | `openssl rand -base64 32`                                                                                                                                                          |
| `NEXTAUTH_URL`                              | App base URL (e.g. `http://localhost:3000`)              | —                                                                                                                                                                                  |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in                                           | [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) — OAuth 2.0 Client ID (Web), redirect URI `http://localhost:3000/api/auth/callback/google` |
| `NEXT_PUBLIC_NEXT_API_URL`                  | This app's public URL                                    | —                                                                                                                                                                                  |
| `NEXT_PUBLIC_BACKTEST_BACKEND_URL`          | The FastAPI backend URL                                  | —                                                                                                                                                                                  |

## Setup

```bash
# from the monorepo root
npm install

# generate the Prisma client and apply migrations (uses the root .env)
npx nx prisma-generate frontend
cd apps/frontend && npm run prisma:migrate:deploy && cd ../..
```

## Run

```bash
npx nx dev frontend        # dev server with Turbopack -> http://localhost:3000
npx nx build frontend      # production build (runs prisma-generate first)
npx nx start frontend      # serve the production build
npx nx lint frontend       # eslint
```

## Nx targets

| Target            | Description                                     |
| ----------------- | ----------------------------------------------- |
| `dev`             | `next dev --turbopack`                          |
| `build`           | `next build` (depends on `prisma-generate`)     |
| `start`           | `next start`                                    |
| `lint`            | `eslint .`                                      |
| `prisma-generate` | Generate the Prisma client from the root `.env` |

Database helper scripts (Prisma) live in `package.json` and target the root
`.env`, e.g. `npm run prisma:studio`, `npm run prisma:migrate:dev`.

## Notes

- On **Next.js 16**, ESLint no longer runs during `next build`; run it on demand
  via `nx lint frontend`.
- This app currently has some pre-existing TypeScript issues that predate the
  monorepo migration, so production builds are configured not to fail on type
  errors (`typescript.ignoreBuildErrors` in `next.config.ts`). These should be
  cleaned up incrementally; run `npx tsc --noEmit` to see them.
