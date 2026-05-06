#!/usr/bin/env bash
# ============================================================================
# GSI — restore PostgreSQL
#
# Uso: ./restore.sh <path_to_backup.sql.gz>
#
# ATTENZIONE: drop-a il database esistente e lo ricrea. Richiede conferma
# interattiva — NON usare in script automatizzati.
#
# Variabili d'ambiente (stesse di backup.sh):
#   PG_HOST, PG_PORT, PG_USER, PG_DATABASE, PG_PASSWORD
# ============================================================================

set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Uso: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "ERRORE: file backup non trovato: $BACKUP_FILE" >&2
    exit 1
fi

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-gsi_user}"
PG_DATABASE="${PG_DATABASE:-gsi}"

echo "ATTENZIONE: ripristino di '$PG_DATABASE' da '$BACKUP_FILE'."
echo "Questo CANCELLA il contenuto attuale del DB su $PG_HOST:$PG_PORT."
read -rp "Digita 'yes' per confermare: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    echo "Annullato."
    exit 0
fi

if [[ -n "${PG_PASSWORD:-}" ]]; then
    export PGPASSWORD="$PG_PASSWORD"
fi

# Drop + recreate DB (collegandosi al DB 'postgres' di sistema)
psql --host="$PG_HOST" --port="$PG_PORT" --username="$PG_USER" --dbname=postgres \
     --command="DROP DATABASE IF EXISTS \"$PG_DATABASE\";"
psql --host="$PG_HOST" --port="$PG_PORT" --username="$PG_USER" --dbname=postgres \
     --command="CREATE DATABASE \"$PG_DATABASE\";"

# Restore
gunzip -c "$BACKUP_FILE" \
    | psql --host="$PG_HOST" --port="$PG_PORT" \
           --username="$PG_USER" --dbname="$PG_DATABASE" \
           --set ON_ERROR_STOP=1

unset PGPASSWORD || true

echo "[$(date -u +%FT%TZ)] Restore completato."
echo "Ricorda: se il dump è pre-Alembic, esegui poi 'alembic upgrade head'."
