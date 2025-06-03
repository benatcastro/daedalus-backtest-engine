#!/bin/bash
set -e

# Create additional databases if needed
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- Create schemas
    CREATE SCHEMA IF NOT EXISTS backtest_data;
    CREATE SCHEMA IF NOT EXISTS analytics;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON SCHEMA backtest_data TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON SCHEMA analytics TO $POSTGRES_USER;

    -- Create indexes for better performance
    -- (These will be created by Alembic migrations, but we can prepare the schema)
EOSQL

echo "Database initialization completed successfully!"
