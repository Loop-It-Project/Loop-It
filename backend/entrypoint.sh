#!/bin/sh
set -e  # Stoppe bei Fehlern

echo "Warte auf Datenbank..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Datenbank ist bereit!"

echo "Installiere postgresql-client..."
apk add --no-cache postgresql-client

echo "=== DEBUGGING START ==="
echo "Umgebungsvariablen:"
echo "DATABASE_URL: $DATABASE_URL"
echo "DB_HOST: $DB_HOST"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"

echo "Dateisystem Check:"
echo "Drizzle Ordner:"
ls -la drizzle/ 2>/dev/null || echo "Kein drizzle Ordner"

echo "Migration Dateien:"
ls -la drizzle/*.sql 2>/dev/null || echo "Keine SQL-Migrationsdateien gefunden"

echo "Schema Datei:"
ls -la src/db/schema.ts 2>/dev/null || echo "Keine Schema-Datei gefunden"

echo "Vorhandene Tabellen VORHER:"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null || echo "Keine Tabellen"

echo "=== FÜHRE MIGRATIONEN AUS ==="
echo "Verwende versionierte Drizzle-Migrationen..."

# Führe versionierte Migrationen aus
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✓ Migrationen erfolgreich ausgeführt"
else
    echo "✗ Fehler bei Migrationen - versuche Fallback"
    echo "Fallback: Verwende drizzle-kit push..."
    npm run db:push --force
    if [ $? -eq 0 ]; then
        echo "✓ Fallback push erfolgreich ausgeführt"
    else
        echo "✗ Kritischer Fehler: Weder Migrationen noch Push funktionieren"
        exit 1
    fi
fi

echo "Vorhandene Tabellen NACHHER:"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null || echo "Keine Tabellen"

echo "Angewendete Migrationen (falls vorhanden):"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM __drizzle_migrations ORDER BY id;" 2>/dev/null || echo "Keine Migrations-Historie verfügbar"

echo "=== DEBUGGING END ==="

echo "Starte Backend..."
npm start