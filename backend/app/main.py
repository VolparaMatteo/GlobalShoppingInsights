import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.utils.logging import configure_logging
from app.utils.rate_limit import limiter
from app.api import (
    articles,
    audit_logs,
    auth,
    calendar,
    comments,
    dashboard,
    export,
    health,
    notifications,
    prompt_folders,
    prompts,
    publish,
    search,
    settings as settings_router,
    taxonomy,
    unsplash,
    users,
)

# Configurazione logging (structlog): JSON in produzione, console in dev/test.
configure_logging()

_log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lo schema DB è gestito da **Alembic**. In produzione eseguire
    #   alembic upgrade head
    # PRIMA di avviare l'app (o dentro lo script di deploy).
    # In dev locale, dopo aver modificato un modello:
    #   alembic revision --autogenerate -m "descrizione"
    #   alembic upgrade head

    # Migrazione di DATI (non schema): cifra password WP legacy in plaintext.
    # Idempotente, sicura da rieseguire. Rimarrà qui finché non avremo un
    # pattern consolidato di data-migrations in Alembic (Sprint successivo).
    try:
        from app.utils.encryption import migrate_plaintext_passwords

        migrated = migrate_plaintext_passwords()
        if migrated:
            _log.info("Cifrate %d password WP legacy in plaintext", migrated)
    except Exception:
        _log.exception("Migrazione delle password WP fallita")

    try:
        from app.workers.scheduler import start_scheduler

        start_scheduler()
    except Exception:
        _log.exception("Avvio scheduler fallito")

    yield

    try:
        from app.workers.scheduler import stop_scheduler

        stop_scheduler()
    except Exception:
        _log.exception("Arresto scheduler fallito")


app = FastAPI(
    title="Global Shopping Insights",
    description="Editorial intelligence platform for global retail & shopping news",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter (slowapi). In ENV=test è disabilitato (vedi app.utils.rate_limit).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Headers di sicurezza (HSTS, CSP, X-Frame-Options, ...).
# Aggiunto per ultimo così starlette lo applica dopo il resto della pipeline.
app.add_middleware(SecurityHeadersMiddleware)

# Request-ID: il più esterno. Popola la ContextVar consumata da structlog
# (così ogni log di una request include il request_id) e aggiunge l'header
# `X-Request-ID` alla risposta.
app.add_middleware(RequestIdMiddleware)

# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount all routers under /api/v1
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(prompts.router, prefix=PREFIX)
app.include_router(prompt_folders.router, prefix=PREFIX)
app.include_router(search.router, prefix=PREFIX)
app.include_router(articles.router, prefix=PREFIX)
app.include_router(comments.router, prefix=PREFIX)
app.include_router(calendar.router, prefix=PREFIX)
app.include_router(publish.router, prefix=PREFIX)
app.include_router(publish.publish_jobs_router, prefix=PREFIX)
app.include_router(taxonomy.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(settings_router.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
app.include_router(health.router, prefix=PREFIX)
app.include_router(unsplash.router, prefix=PREFIX)
app.include_router(audit_logs.router, prefix=PREFIX)
