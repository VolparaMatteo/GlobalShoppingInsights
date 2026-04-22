#!/usr/bin/env sh
# Entrypoint del container backend.
# 1. Attende che Postgres sia raggiungibile
# 2. Applica le migration Alembic (idempotente)
# 3. Esegue seed.py (idempotente: crea admin/dati default solo se mancano)
# 4. Avvia uvicorn con --reload (hot-reload del codice via volume mount)

set -e

echo "[entrypoint] DATABASE_URL=${DATABASE_URL:-sqlite:///./gsi.db}"

# Wait for Postgres (se DATABASE_URL punta a postgres).
case "${DATABASE_URL:-}" in
    postgresql*)
        echo "[entrypoint] In attesa di PostgreSQL..."
        python - <<'PY'
import os, sys, time
from sqlalchemy import create_engine, text

url = os.environ["DATABASE_URL"]
for i in range(60):
    try:
        with create_engine(url).connect() as c:
            c.execute(text("SELECT 1"))
        print(f"[entrypoint] DB pronto dopo {i}s")
        sys.exit(0)
    except Exception as e:
        time.sleep(1)
print("[entrypoint] Timeout attesa DB", file=sys.stderr)
sys.exit(1)
PY
        ;;
esac

echo "[entrypoint] Applico migration Alembic..."
alembic upgrade head

echo "[entrypoint] Seed idempotente..."
python seed.py || echo "[entrypoint] WARNING: seed.py ha restituito errore (continuo)"

echo "[entrypoint] Avvio uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
