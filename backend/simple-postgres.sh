#!/bin/bash
# simple-postgres.sh

# Einfaches PostgreSQL Setup für Loop-It
echo "🐘 Starting PostgreSQL for Loop-It..."

# Stoppe und entferne existierende Container
docker stop loop-it-postgres 2>/dev/null || true
docker rm loop-it-postgres 2>/dev/null || true

# Starte PostgreSQL Container
docker run -d \
  --name loop-it-postgres \
  --restart unless-stopped \
  -e POSTGRES_DB=loop_it_dev \
  -e POSTGRES_USER=loop_it_user \
  -e POSTGRES_PASSWORD=loop_it_password \
  -p 5432:5432 \
  -v loop_it_postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Test Verbindung
if docker exec loop-it-postgres pg_isready -U loop_it_user -d loop_it_dev; then
    echo "✅ PostgreSQL is ready!"
    echo ""
    echo "📋 Connection Details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: loop_it_dev"
    echo "  Username: loop_it_user"
    echo "  Password: loop_it_password"
    echo ""
    echo "🔗 Connection URL:"
    echo "  DATABASE_URL=postgresql://loop_it_user:loop_it_password@localhost:5432/loop_it_dev"
    echo ""
    echo "🛠️ Commands:"
    echo "  Connect to DB: docker exec -it loop-it-postgres psql -U loop_it_user -d loop_it_dev"
    echo "  View logs: docker logs loop-it-postgres"
    echo "  Stop DB: docker stop loop-it-postgres"
else
    echo "❌ PostgreSQL failed to start"
    exit 1
fi