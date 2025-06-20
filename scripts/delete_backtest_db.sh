#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to .env relative to the script directory (parent directory)
ENV_PATH="$SCRIPT_DIR/../.env"

# Load .env from parent directory
if [ ! -f "$ENV_PATH" ]; then
  echo "Error: $ENV_PATH file not found!"
  exit 1
fi

# Export variables from .env (ignoring comments and empty lines)
export $(grep -v '^#' "$ENV_PATH" | xargs)

# Check required variables
if [ -z "$BACKTEST_DB_NAME" ] || [ -z "$BACKTEST_DB_USER" ] || [ -z "$BACKTEST_DB_PASSWORD" ]; then
  echo "BACKTEST_DB_NAME, BACKTEST_DB_USER or BACKTEST_DB_PASSWORD missing in ../.env"
  exit 1
fi

echo "Using database: $BACKTEST_DB_NAME"
echo "Using user: $BACKTEST_DB_USER"
echo "Using host: ${BACKTEST_DB_HOST:-localhost}"
echo "Using port: ${BACKTEST_DB_PORT:-5432}"

export PGPASSWORD=$BACKTEST_DB_PASSWORD

echo "Terminating connections to database '$BACKTEST_DB_NAME'..."
psql -h "${BACKTEST_DB_HOST:-localhost}" -p "${BACKTEST_DB_PORT:-5432}" -U "$BACKTEST_DB_USER" -d postgres -c \
"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$BACKTEST_DB_NAME' AND pid <> pg_backend_pid();"

echo "Dropping database '$BACKTEST_DB_NAME'..."
psql -h "${BACKTEST_DB_HOST:-localhost}" -p "${BACKTEST_DB_PORT:-5432}" -U "$BACKTEST_DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $BACKTEST_DB_NAME;"

echo "Creating database '$BACKTEST_DB_NAME'..."
psql -h "${BACKTEST_DB_HOST:-localhost}" -p "${BACKTEST_DB_PORT:-5432}" -U "$BACKTEST_DB_USER" -d postgres -c "CREATE DATABASE $BACKTEST_DB_NAME;"

unset PGPASSWORD

echo "Database reset complete."
