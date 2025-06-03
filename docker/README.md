# Daedalus Docker Setup

This Docker setup provides two PostgreSQL databases and pgAdmin for database administration.

**Note**: This setup uses the top-level `.env` file (`/home/bena/Projects/daedalus/.env`) for configuration, not a local one in the docker directory.

## Services

- **postgres-backtests**: PostgreSQL database for FastAPI backend (backtests data)
  - Port: 5432
  - Database: backtests_db
  - User: postgres

- **postgres-nextjs**: PostgreSQL database for Next.js application (user data, auth)
  - Port: 5433
  - Database: nextjs_db
  - User: postgres

- **pgadmin**: Web-based PostgreSQL administration tool
  - URL: http://localhost:5050
  - Email: admin@daedalus.local
  - Password: admin123

## Quick Start

1. **Setup environment**:
   ```bash
   # From the project root directory
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

2. **Start services**:
   ```bash
   cd docker
   ./manage.sh up
   ```

3. **Access pgAdmin**:
   - Open http://localhost:5050
   - Login with: admin@daedalus.local / admin123
   - Both databases are pre-configured

## Management Commands

```bash
# Start all services
./manage.sh up

# Stop all services
./manage.sh down

# View logs
./manage.sh logs
./manage.sh logs postgres-backtests  # specific service

# Connect to databases via CLI
./manage.sh db-connect backtests     # Connect to backtests database
./manage.sh db-connect nextjs        # Connect to Next.js database

# Backup databases
./manage.sh db-backup backtests      # Backup backtests database
./manage.sh db-backup nextjs         # Backup Next.js database

# Open shell in containers
./manage.sh shell postgres-backtests
./manage.sh shell postgres-nextjs
./manage.sh shell pgadmin

# Check service health
./manage.sh health

# Clean up (removes all data!)
./manage.sh clean
```

## Database Connection Strings

### For Local Development (from host machine):
- **Backtests DB**: `postgresql://postgres:postgres123@localhost:5432/backtests_db`
- **Next.js DB**: `postgresql://postgres:postgres456@localhost:5433/nextjs_db`

### For Containerized Applications:
- **Backtests DB**: `postgresql://postgres:postgres123@postgres-backtests:5432/backtests_db`
- **Next.js DB**: `postgresql://postgres:postgres456@postgres-nextjs:5432/nextjs_db`

## Security Notes

⚠️ **Important**: The default passwords are for development only!

For production:
1. Change all passwords in the `.env` file
2. Use strong, unique passwords
3. Consider using Docker secrets for sensitive data
4. Restrict network access to databases
5. Enable SSL/TLS connections

## Persistence

Database data is persisted in Docker volumes:
- `postgres_backtests_data`: Backtests database data
- `postgres_nextjs_data`: Next.js database data
- `pgadmin_data`: pgAdmin configuration and settings

To completely remove all data, use: `./manage.sh clean`

## Troubleshooting

### Port Conflicts
If ports 5432, 5433, or 5050 are already in use:
1. Edit `docker-compose.yml` to change the host ports
2. Update connection strings accordingly

### Database Connection Issues
1. Ensure services are running: `./manage.sh health`
2. Check logs: `./manage.sh logs postgres-backtests`
3. Verify environment variables in `.env`

### pgAdmin Access Issues
1. Clear browser cache
2. Check pgAdmin logs: `./manage.sh logs pgadmin`
3. Restart pgAdmin: `docker-compose restart pgadmin`
