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
# POSTGRES_PASSWORD nicht loggen aus Sicherheitsgründen!

echo "Dateisystem Check:"
echo "Drizzle Ordner:"
ls -la drizzle/ 2>/dev/null || echo "Kein drizzle Ordner"

echo "Schema Datei:"
ls -la src/db/schema.ts 2>/dev/null || echo "Keine Schema-Datei gefunden"

echo "Vorhandene Tabellen VORHER:"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null || echo "Keine Tabellen"

echo "=== FÜHRE MIGRATIONEN AUS ==="
echo "1. Generate migrations..."
npm run db:generate

echo "2. Prüfe generierte SQL-Dateien..."
ls -la drizzle/*.sql 2>/dev/null || echo "Keine SQL-Dateien gefunden"

echo "3. Führe SQL-Dateien direkt aus..."
SQL_EXECUTED=false
for sql_file in drizzle/*.sql; do
    if [ -f "$sql_file" ]; then
        echo "Führe aus: $sql_file"
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$sql_file"
        if [ $? -eq 0 ]; then
            echo "✓ $sql_file erfolgreich ausgeführt"
            SQL_EXECUTED=true
        else
            echo "✗ Fehler bei $sql_file"
        fi
    fi
done

if [ "$SQL_EXECUTED" = false ]; then
    echo "Keine SQL-Dateien gefunden oder ausgeführt!"
    echo "Inhalt des drizzle Ordners:"
    ls -la drizzle/ 2>/dev/null || echo "Drizzle Ordner existiert nicht"
fi

echo "Vorhandene Tabellen NACHHER:"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null || echo "Keine Tabellen"

echo "=== DEBUGGING END ==="

echo "Starte Backend..."
npm start