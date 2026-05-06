#!/usr/bin/env bash
# ============================================================================
# GSI — backup PostgreSQL
#
# Esegue `pg_dump` compresso con retention configurabile (default 30 giorni).
# Pensato per girare su VPS Linux come cron job.
#
# Variabili d'ambiente:
#   PG_HOST          default: localhost
#   PG_PORT          default: 5432
#   PG_USER          default: gsi_user
#   PG_DATABASE      default: gsi
#   PG_PASSWORD      opzionale (meglio usare ~/.pgpass)
#   BACKUP_DIR       default: /var/backups/gsi
#   RETENTION_DAYS   default: 30
#
# Esempio cron (root o utente dedicato):
#   0 3 * * * /opt/gsi/scripts/backup.sh >> /var/log/gsi-backup.log 2>&1
# ============================================================================

set -euo pipefail

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-gsi_user}"
PG_DATABASE="${PG_DATABASE:-gsi}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gsi}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +'%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/gsi_${TIMESTAMP}.sql.gz"

if [[ -n "${PG_PASSWORD:-}" ]]; then
    export PGPASSWORD="$PG_PASSWORD"
fi

pg_dump \
    --host="$PG_HOST" \
    --port="$PG_PORT" \
    --username="$PG_USER" \
    --dbname="$PG_DATABASE" \
    --no-owner \
    --no-privileges \
    --format=plain \
    | gzip > "$BACKUP_FILE"

unset PGPASSWORD || true

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -u +%FT%TZ)] Backup OK: $BACKUP_FILE ($SIZE)"

# Cleanup backup più vecchi di RETENTION_DAYS
REMOVED=$(find "$BACKUP_DIR" -name 'gsi_*.sql.gz' -type f -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
echo "[$(date -u +%FT%TZ)] Retention: rimossi $REMOVED backup più vecchi di $RETENTION_DAYS giorni"
