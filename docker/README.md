# Daedalus Docker Setup

This Docker setup provides two PostgreSQL databases and pgAdmin for database
administration.

**Note:** This setup reads the **monorepo root `.env`** file for configuration
(values like `BACKTEST_DB_*`, `NEXTAUTH_DB_*`, and `PGADMIN_*`). Run the commands
below from the `docker/` directory so Compose picks up `../.env` automatically,
or pass `--env-file ../.env`.

## Services

- **postgres-backtests**: PostgreSQL database for the FastAPI backend (backtest data)
  - Host port: `${BACKTEST_DB_PORT}` (e.g. 5432)
  - Database/User: `${BACKTEST_DB_NAME}` / `${BACKTEST_DB_USER}`

- **postgres-nextjs**: PostgreSQL database for the Next.js app (user data, auth)
  - Host port: `${NEXTAUTH_DB_PORT}` (e.g. 5433)
  - Database/User: `${NEXTAUTH_DB_NAME}` / `${NEXTAUTH_DB_USER}`

- **pgadmin**: Web-based PostgreSQL administration tool
  - URL: http://localhost:5050
  - Login: `${PGADMIN_DEFAULT_EMAIL}` / `${PGADMIN_DEFAULT_PASSWORD}`

## Quick Start

1. **Set up environment** (from the repository root):
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and pgAdmin login
   ```

2. **Start services**:
   ```bash
   cd docker
   docker compose up -d
   ```

3. **Access pgAdmin**: open http://localhost:5050 and log in with the
   `PGADMIN_*` credentials from your `.env`. Both databases are pre-registered
   via `pgadmin/servers.json`.

## Management Commands

Run these from the `docker/` directory:

```bash
# Start all services (detached)
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f
docker compose logs -f postgres-backtests   # specific service

# Connect to a database via CLI
docker compose exec postgres-backtests psql -U "$BACKTEST_DB_USER" -d "$BACKTEST_DB_NAME"
docker compose exec postgres-nextjs    psql -U "$NEXTAUTH_DB_USER" -d "$NEXTAUTH_DB_NAME"

# Open a shell in a container
docker compose exec postgres-backtests bash

# Check service status / health
docker compose ps

# Restart a service
docker compose restart pgadmin

# Stop and REMOVE ALL DATA (volumes)
docker compose down -v
```

## Database Connection Strings

With the example credentials in `.env.example`:

### From the host machine (local development)
- **Backtests DB**: `postgresql://<user>:<password>@localhost:5432/backtests_db`
- **Next.js DB**: `postgresql://<user>:<password>@localhost:5433/nextjs_db`

### From other containers (same Compose network)
- **Backtests DB**: `postgresql://<user>:<password>@postgres-backtests:5432/backtests_db`
- **Next.js DB**: `postgresql://<user>:<password>@postgres-nextjs:5432/nextjs_db`

## Security Notes

⚠️ The default/example passwords are for local development only!

For production: change all passwords in `.env`, use strong unique secrets,
consider Docker secrets, restrict network access, and enable SSL/TLS.

## Persistence

Database data is persisted in Docker volumes:
- `postgres_backtests_data`, `postgres_nextjs_data`, `pgadmin_data`

To completely remove all data: `docker compose down -v`.

## Troubleshooting

**Port conflicts (5432 / 5433 / 5050):** change the host ports in
`docker-compose.yml` (and the matching `.env` values), then update your
connection strings.

**Database connection issues:** ensure services are healthy (`docker compose ps`),
check logs (`docker compose logs postgres-backtests`), and verify the variables
in your root `.env`.

**pgAdmin access issues:** clear the browser cache, check
`docker compose logs pgadmin`, and restart with `docker compose restart pgadmin`.
