#!/bin/bash
# setup-postgres.sh

set -e

echo "🐘 Setting up PostgreSQL for Loop-It Development"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
print_step "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is ready"

# Check if Docker Compose is available
print_step "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_success "Docker Compose is ready"

# Create postgres-init directory if it doesn't exist
print_step "Creating postgres-init directory..."
mkdir -p postgres-init
print_success "postgres-init directory created"

# Create initial database setup script
print_step "Creating database initialization script..."
cat > postgres-init/01-init.sql << 'EOF'
-- Loop-It Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create additional databases if needed
-- CREATE DATABASE loop_it_test;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Loop-It PostgreSQL database initialized successfully!';
END $$;
EOF

print_success "Database initialization script created"

# Create environment file template
print_step "Creating environment configuration..."
cat > .env.postgres << 'EOF'
# PostgreSQL Configuration for Loop-It
POSTGRES_DB=loop_it_dev
POSTGRES_USER=loop_it_user
POSTGRES_PASSWORD=loop_it_password

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@loop-it.local
PGADMIN_DEFAULT_PASSWORD=admin123

# Connection URL for your backend
DATABASE_URL=postgresql://loop_it_user:loop_it_password@localhost:5432/loop_it_dev
EOF

print_success "Environment configuration created"

# Function to start PostgreSQL
start_postgres() {
    print_step "Starting PostgreSQL container..."
    
    if docker-compose -f docker-compose.postgres.yml up -d; then
        print_success "PostgreSQL container started successfully"
        
        # Wait for PostgreSQL to be ready
        print_step "Waiting for PostgreSQL to be ready..."
        timeout=30
        while [ $timeout -gt 0 ]; do
            if docker exec loop-it-postgres pg_isready -U loop_it_user -d loop_it_dev &> /dev/null; then
                print_success "PostgreSQL is ready and accepting connections"
                break
            fi
            echo -n "."
            sleep 1
            timeout=$((timeout - 1))
        done
        
        if [ $timeout -eq 0 ]; then
            print_error "PostgreSQL failed to start within 30 seconds"
            return 1
        fi
        
        echo ""
        print_success "Database setup completed!"
        print_step "Connection Details:"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: loop_it_dev"
        echo "  Username: loop_it_user"
        echo "  Password: loop_it_password"
        echo ""
        echo "  Connection URL: postgresql://loop_it_user:loop_it_password@localhost:5432/loop_it_dev"
        echo ""
        print_step "pgAdmin Access (optional):"
        echo "  URL: http://localhost:5050"
        echo "  Email: admin@loop-it.local"
        echo "  Password: admin123"
        echo ""
        print_warning "Make sure to update your backend .env file with the DATABASE_URL above"
        
    else
        print_error "Failed to start PostgreSQL container"
        return 1
    fi
}

# Function to stop PostgreSQL
stop_postgres() {
    print_step "Stopping PostgreSQL container..."
    docker-compose -f docker-compose.postgres.yml down
    print_success "PostgreSQL container stopped"
}

# Function to restart PostgreSQL
restart_postgres() {
    stop_postgres
    start_postgres
}

# Function to show PostgreSQL logs
show_logs() {
    print_step "Showing PostgreSQL logs..."
    docker-compose -f docker-compose.postgres.yml logs -f postgres
}

# Function to connect to PostgreSQL shell
connect_psql() {
    print_step "Connecting to PostgreSQL shell..."
    docker exec -it loop-it-postgres psql -U loop_it_user -d loop_it_dev
}

# Function to backup database
backup_database() {
    print_step "Creating database backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="loop_it_backup_${timestamp}.sql"
    
    docker exec loop-it-postgres pg_dump -U loop_it_user -d loop_it_dev > "$backup_file"
    print_success "Database backup created: $backup_file"
}

# Function to restore database
restore_database() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path: ./setup-postgres.sh restore <backup-file>"
        return 1
    fi
    
    print_step "Restoring database from $1..."
    docker exec -i loop-it-postgres psql -U loop_it_user -d loop_it_dev < "$1"
    print_success "Database restored successfully"
}

# Function to reset database
reset_database() {
    print_warning "This will delete all data in the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Resetting database..."
        docker exec loop-it-postgres psql -U loop_it_user -d loop_it_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        print_success "Database reset completed"
    else
        print_step "Database reset cancelled"
    fi
}

# Function to show status
show_status() {
    print_step "PostgreSQL Container Status:"
    docker-compose -f docker-compose.postgres.yml ps
}

# Main script logic
case "${1:-start}" in
    start)
        start_postgres
        ;;
    stop)
        stop_postgres
        ;;
    restart)
        restart_postgres
        ;;
    logs)
        show_logs
        ;;
    psql)
        connect_psql
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    reset)
        reset_database
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|psql|backup|restore|reset|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start PostgreSQL container (default)"
        echo "  stop    - Stop PostgreSQL container"
        echo "  restart - Restart PostgreSQL container"
        echo "  logs    - Show PostgreSQL logs"
        echo "  psql    - Connect to PostgreSQL shell"
        echo "  backup  - Create database backup"
        echo "  restore - Restore database from backup file"
        echo "  reset   - Reset database (DELETE ALL DATA)"
        echo "  status  - Show container status"
        exit 1
        ;;
esac