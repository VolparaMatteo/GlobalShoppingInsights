"""Observability setup: Sentry opt-in + Prometheus metrics.

Tutto opt-in via settings:
- settings.SENTRY_DSN vuoto → Sentry disabilitato (nessuna dipendenza richiesta)
- settings.METRICS_ENABLED == False → endpoint /metrics non esposto

Motivi della separazione:
- Sentry `init()` deve avvenire PRIMA che FastAPI costruisca l'app, per
  catturare anche gli errori in lifespan.
- `prometheus-fastapi-instrumentator` si monta DOPO l'app creata.
"""

from __future__ import annotations

import logging

from app.config import settings

_log = logging.getLogger(__name__)


def init_sentry() -> bool:
    """Inizializza Sentry se SENTRY_DSN è configurato.

    Ritorna True se abilitato, False se saltato (DSN vuoto / modulo mancante).
    """
    if not settings.SENTRY_DSN:
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        _log.warning(
            "SENTRY_DSN configurato ma sentry-sdk non installato — "
            "aggiungi 'sentry-sdk[fastapi]' a requirements.txt"
        )
        return False

    environment = settings.SENTRY_ENVIRONMENT or settings.ENV
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=environment,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,  # mai PII di default (compliance)
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
        ],
    )
    _log.info(
        "Sentry inizializzato (env=%s, traces=%s)", environment, settings.SENTRY_TRACES_SAMPLE_RATE
    )
    return True


def setup_prometheus(app):  # type: ignore[no-untyped-def]
    """Monta il middleware prometheus-fastapi-instrumentator ed espone /metrics.

    Ritorna True se abilitato, False se saltato.
    """
    if not settings.METRICS_ENABLED:
        return False

    try:
        from prometheus_fastapi_instrumentator import Instrumentator
    except ImportError:
        _log.warning(
            "METRICS_ENABLED=True ma prometheus-fastapi-instrumentator non installato — "
            "aggiungi 'prometheus-fastapi-instrumentator' a requirements.txt"
        )
        return False

    # Metriche di default: latency histogram, request count, in-progress.
    # Escludiamo /metrics stesso dalle statistiche per evitare rumore.
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        excluded_handlers=["/metrics", "/api/v1/health"],
    )
    instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
    _log.info("Prometheus /metrics esposto")
    return True
