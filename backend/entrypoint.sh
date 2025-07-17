#!/bin/sh
set -e

echo "Starting Loop-It Backend..."

echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

echo "Running Drizzle migrations..."
npm run db:migrate

echo "Starting application..."
exec npm start