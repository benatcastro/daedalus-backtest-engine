#!/bin/bash

# Daedalus Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENV_FILE="../.env"

# Functions
print_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  up           Start all database services"
    echo "  down         Stop all services"
    echo "  restart      Restart all services"
    echo "  logs         Show logs for all services"
    echo "  build        Build all images (no-op for database-only setup)"
    echo "  clean        Remove all containers and volumes"
    echo "  db-connect   Connect to database (backtests|nextjs)"
    echo "  db-backup    Backup database (backtests|nextjs)"
    echo "  health       Check health of all services"
    echo "  shell        Open shell in specified service"
    echo ""
    echo "Options:"
    echo "  --env FILE   Use specific environment file (default: .env)"
    echo "  --service    Specify service name for logs/shell commands"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up                           # Start all services"
    echo "  $0 db-connect backtests         # Connect to backtests database"
    echo "  $0 db-connect nextjs            # Connect to Next.js database"
    echo "  $0 db-backup backtests          # Backup backtests database"
    echo "  $0 logs postgres-backtests      # Show logs for specific service"
    echo "  $0 shell pgadmin                # Open shell in pgAdmin container"
    echo ""
    echo "Note: Uses top-level .env file (../env) for configuration"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file $ENV_FILE not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            log_info "Please edit $ENV_FILE with your configuration before running services."
        elif [ -f "../.env.example" ]; then
            cp ../.env.example "$ENV_FILE"
            log_info "Please edit $ENV_FILE with your configuration before running services."
        else
            log_error ".env.example file not found. Please create $ENV_FILE manually."
            exit 1
        fi
    fi
}

wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $service to be healthy..."

    while [ $attempt -le $max_attempts ]; do
        if docker-compose --env-file "$ENV_FILE" ps "$service" | grep -q "healthy\|Up"; then
            log_success "$service is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$service failed to become healthy within $((max_attempts * 2)) seconds"
    return 1
}

# Main script logic
case "${1:-}" in
    "up")
        check_env_file
        log_info "Starting database services..."
        docker-compose --env-file "$ENV_FILE" up -d

        # Wait for databases to be ready
        wait_for_service "postgres-backtests"
        wait_for_service "postgres-nextjs"

        log_success "All database services started successfully!"
        log_info "Services available at:"
        echo "  - pgAdmin:           http://localhost:5050"
        echo "  - Backtests DB:      localhost:5432 (daedalus_backtests)"
        echo "  - Next.js DB:        localhost:5433 (daedalus_users)"
        echo ""
        echo "pgAdmin credentials:"
        echo "  - Email:    admin@daedalus.local"
        echo "  - Password: admin_secure_123"
        ;;

    "down")
        log_info "Stopping all services..."
        docker-compose --env-file "$ENV_FILE" down
        log_success "All services stopped!"
        ;;

    "restart")
        log_info "Restarting all services..."
        docker-compose --env-file "$ENV_FILE" restart
        log_success "All services restarted!"
        ;;

    "logs")
        if [ -n "${2:-}" ]; then
            docker-compose --env-file "$ENV_FILE" logs -f "$2"
        else
            docker-compose --env-file "$ENV_FILE" logs -f
        fi
        ;;

    "build")
        log_info "No images to build (using official PostgreSQL and pgAdmin images)..."
        log_success "Nothing to build!"
        ;;

    "clean")
        log_warning "This will remove ALL containers, volumes, and databases for this project."
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Cleaning up..."
            docker-compose --env-file "$ENV_FILE" down -v
            docker system prune -f
            log_success "Cleanup completed!"
        else
            log_info "Cleanup cancelled."
        fi
        ;;

    "db-connect")
        db="${2:-backtests}"
        if [ "$db" = "backtests" ]; then
            log_info "Connecting to backtests database..."
            docker-compose --env-file "$ENV_FILE" exec postgres-backtests psql -U postgres -d daedalus_backtests
        elif [ "$db" = "nextjs" ]; then
            log_info "Connecting to Next.js database..."
            docker-compose --env-file "$ENV_FILE" exec postgres-nextjs psql -U postgres -d daedalus_users
        else
            log_error "Unknown database: $db. Use 'backtests' or 'nextjs'."
            exit 1
        fi
        ;;

    "db-backup")
        db="${2:-backtests}"
        timestamp=$(date +%Y%m%d_%H%M%S)
        if [ "$db" = "backtests" ]; then
            log_info "Backing up backtests database..."
            docker-compose --env-file "$ENV_FILE" exec postgres-backtests pg_dump -U postgres daedalus_backtests > "backup_backtests_$timestamp.sql"
            log_success "Backup saved as backup_backtests_$timestamp.sql"
        elif [ "$db" = "nextjs" ]; then
            log_info "Backing up Next.js database..."
            docker-compose --env-file "$ENV_FILE" exec postgres-nextjs pg_dump -U postgres daedalus_users > "backup_nextjs_$timestamp.sql"
            log_success "Backup saved as backup_nextjs_$timestamp.sql"
        else
            log_error "Unknown database: $db. Use 'backtests' or 'nextjs'."
            exit 1
        fi
        ;;

    "health")
        log_info "Checking service health..."
        docker-compose --env-file "$ENV_FILE" ps
        ;;

    "shell")
        service="${2:-postgres-backtests}"
        log_info "Opening shell in $service..."
        if [ "$service" = "postgres-backtests" ] || [ "$service" = "postgres-nextjs" ]; then
            docker-compose --env-file "$ENV_FILE" exec "$service" /bin/bash
        elif [ "$service" = "pgadmin" ]; then
            docker-compose --env-file "$ENV_FILE" exec "$service" /bin/sh
        else
            log_error "Unknown service: $service. Use 'postgres-backtests', 'postgres-nextjs', or 'pgadmin'."
            exit 1
        fi
        ;;

    "--help"|"help"|"")
        print_usage
        ;;

    *)
        log_error "Unknown command: $1"
        print_usage
        exit 1
        ;;
esac
