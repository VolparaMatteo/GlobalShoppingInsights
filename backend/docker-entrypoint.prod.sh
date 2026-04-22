#!/usr/bin/env sh
# Entrypoint PRODUZIONE del container backend.
# 1. Attende che Postgres sia raggiungibile
# 2. Applica le migration Alembic (idempotente, autoritativo)
# 3. Esegue seed.py (idempotente: crea admin/dati default solo se mancano)
# 4. Avvia gunicorn con worker UvicornWorker
#
# Default: 1 worker. APScheduler vive in-process: con N>1 worker ogni job
# verrebbe eseguito N volte. Sprint 6 sposterà lo scheduler su ARQ+Redis e
# permetterà di scalare i web workers in modo sicuro.

set -e

# Logga l'URL mascherando la password (host e db restano visibili)
_db_masked=$(printf '%s' "${DATABASE_URL:-sqlite:///./gsi.db}" | sed -E 's#(://[^:]+:)[^@]+(@)#\1****\2#')
echo "[entrypoint-prod] DATABASE_URL=${_db_masked}"

case "${DATABASE_URL:-}" in
    postgresql*)
        echo "[entrypoint-prod] In attesa di PostgreSQL..."
        python - <<'PY'
import os, sys, time
from sqlalchemy import create_engine, text

url = os.environ["DATABASE_URL"]
for i in range(60):
    try:
        with create_engine(url).connect() as c:
            c.execute(text("SELECT 1"))
        print(f"[entrypoint-prod] DB pronto dopo {i}s")
        sys.exit(0)
    except Exception:
        time.sleep(1)
print("[entrypoint-prod] Timeout attesa DB", file=sys.stderr)
sys.exit(1)
PY
        ;;
esac

echo "[entrypoint-prod] Applico migration Alembic..."
alembic upgrade head

echo "[entrypoint-prod] Seed idempotente..."
python seed.py || echo "[entrypoint-prod] WARNING: seed.py ha restituito errore (continuo)"

WORKERS="${GUNICORN_WORKERS:-1}"
TIMEOUT="${GUNICORN_TIMEOUT:-60}"

echo "[entrypoint-prod] Avvio gunicorn (workers=${WORKERS}, timeout=${TIMEOUT}s)..."
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers "${WORKERS}" \
    --bind 0.0.0.0:8000 \
    --timeout "${TIMEOUT}" \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
