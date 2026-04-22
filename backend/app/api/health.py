"""Health endpoint con check deep di dipendenze critiche.

Endpoint: GET /api/v1/health

Check:
    - database: ping via `SELECT 1` + latenza in ms
    - disk: spazio libero sul filesystem di UPLOAD_DIR
    - uploads: probe di scrittura nella directory upload
    - ollama: probe `/api/tags` se OLLAMA_BASE_URL è settato (altrimenti skipped)

Status HTTP:
    - 200 OK se il DB risponde (anche in caso di "degraded" su check non-critici)
    - 503 SERVICE UNAVAILABLE se il DB non risponde

Lo stato complessivo è derivato così:
    - status="ok"       → tutti i check non-critici verdi
    - status="degraded" → DB ok ma qualche check non-critico in warning/error
    - status="error"    → DB down (→ 503)
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import SessionLocal

router = APIRouter(tags=["health"])


# --------------------------------------------------------------------------
# Check helpers — ognuno torna un dict {"status": "...", ...dettagli}
# Nessun check può lanciare eccezioni: tutto viene catturato e riportato.
# --------------------------------------------------------------------------


def _check_db() -> dict[str, Any]:
    start = time.perf_counter()
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
        return {"status": "ok", "latency_ms": elapsed_ms}
    except Exception as exc:
        return {
            "status": "error",
            "error": type(exc).__name__,
            "message": str(exc)[:200],
        }
    finally:
        db.close()


def _check_disk(path: str, min_free_gb: float) -> dict[str, Any]:
    import shutil

    target = path if os.path.isdir(path) else os.path.dirname(os.path.abspath(path)) or "."
    try:
        usage = shutil.disk_usage(target)
        free_gb = round(usage.free / (1024**3), 2)
        total_gb = round(usage.total / (1024**3), 2)
        used_pct = round((1 - usage.free / usage.total) * 100, 1)
        status = "ok" if free_gb >= min_free_gb else "warning"
        return {
            "status": status,
            "free_gb": free_gb,
            "total_gb": total_gb,
            "used_pct": used_pct,
            "path": target,
        }
    except Exception as exc:
        return {"status": "error", "error": type(exc).__name__, "message": str(exc)[:200]}


def _check_uploads_writable(path: str) -> dict[str, Any]:
    try:
        os.makedirs(path, exist_ok=True)
        probe = os.path.join(path, ".health-probe")
        with open(probe, "w", encoding="utf-8") as fh:
            fh.write("ok")
        os.unlink(probe)
        return {"status": "ok", "path": path}
    except Exception as exc:
        return {
            "status": "error",
            "error": type(exc).__name__,
            "message": str(exc)[:200],
            "path": path,
        }


def _check_ollama(base_url: str) -> dict[str, Any]:
    if not base_url:
        return {"status": "skipped", "reason": "OLLAMA_BASE_URL not configured"}
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        with httpx.Client(timeout=2.0) as client:
            r = client.get(url)
        if r.status_code == 200:
            try:
                models = [m.get("name") for m in r.json().get("models", [])]
            except Exception:
                models = []
            return {"status": "ok", "models": models[:5]}
        return {"status": "error", "http_status": r.status_code}
    except Exception as exc:
        return {"status": "error", "error": type(exc).__name__, "message": str(exc)[:200]}


# --------------------------------------------------------------------------
# Endpoint
# --------------------------------------------------------------------------


@router.get("/health")
def health_check():
    checks: dict[str, Any] = {
        "database": _check_db(),
        "disk": _check_disk(settings.UPLOAD_DIR, settings.HEALTH_MIN_FREE_DISK_GB),
        "uploads": _check_uploads_writable(settings.UPLOAD_DIR),
        "ollama": _check_ollama(settings.OLLAMA_BASE_URL),
    }

    db_ok = checks["database"]["status"] == "ok"

    has_warning = any(
        c.get("status") in ("warning", "error") for key, c in checks.items() if key != "database"
    )

    if not db_ok:
        overall = "error"
    elif has_warning:
        overall = "degraded"
    else:
        overall = "ok"

    body: dict[str, Any] = {
        "status": overall,
        "version": "1.0.0",
        "env": settings.ENV,
        "checks": checks,
    }
    return JSONResponse(content=body, status_code=200 if db_ok else 503)
