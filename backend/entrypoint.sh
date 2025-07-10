#!/bin/sh
set -e

echo "🚀 Starting Loop-It Backend (Final Robust Version)..."

echo "⏳ Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Database is ready!"

echo "📦 Installing postgresql-client..."
apk add --no-cache postgresql-client

echo "🔍 Testing database connection..."
if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database connection failed"
    exit 1
fi
echo "✅ Database connection successful"

echo "🗄️ Existing tables BEFORE migration:"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null || echo "No tables"

echo "🚀 Executing schema sync..."
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ Schema sync successful"
else
    echo "❌ Schema sync failed"
    exit 1
fi

echo "ℹ️ Skipping manual foreign key fixes — handled by Drizzle migrations"


echo "🔍 Final validation..."
if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT \"creatorId\" FROM universes LIMIT 1;" > /dev/null 2>&1; then
    echo "❌ Schema validation failed"
    exit 1
fi

echo "📊 Final database status:"
echo "- Tables: $(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)"
echo "- Foreign Keys: $(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';" | xargs)"

echo "🎯 Backend ready to start!"
exec npm start