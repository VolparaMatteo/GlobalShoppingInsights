"""Configurazione logging con structlog.

- Produzione: output JSON su stdout (consumabile da raccoglitori come
  Loki, Datadog, CloudWatch, Sentry logs).
- Dev / test: output console colorato leggibile.

Inoltre:
- `request_id` viene propagato automaticamente in ogni log di una request
  tramite la ContextVar `request_id_var` popolata dal RequestIdMiddleware.
- I campi che contengono segreti (password, token, api key, ecc.) vengono
  automaticamente mascherati prima della serializzazione.
"""

from __future__ import annotations

import logging
import sys
from contextvars import ContextVar
from typing import Any

import structlog
from structlog.typing import EventDict, WrappedLogger

from app.config import settings

# ContextVar popolata dal RequestIdMiddleware a ogni inizio request.
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)


# Chiavi (match case-insensitive, substring) che verranno mascherate nei log.
_SENSITIVE_SUBSTRINGS = (
    "password",
    "passwd",
    "secret",
    "api_key",
    "apikey",
    "token",
    "authorization",
    "wp_app_password",
    "encryption_key",
)


def _add_request_id(_logger: WrappedLogger, _method: str, event_dict: EventDict) -> EventDict:
    """Aggiunge `request_id` al log se la ContextVar è popolata."""
    rid = request_id_var.get()
    if rid:
        event_dict.setdefault("request_id", rid)
    return event_dict


def _mask_secrets(_logger: WrappedLogger, _method: str, event_dict: EventDict) -> EventDict:
    """Maschera i valori di chiavi sensibili (password, token, ...)."""
    for key in list(event_dict.keys()):
        if not isinstance(key, str):
            continue
        if any(sub in key.lower() for sub in _SENSITIVE_SUBSTRINGS):
            event_dict[key] = "***"
    return event_dict


def configure_logging() -> None:
    """Configura structlog + logging stdlib.

    Idempotente: chiamabile più volte senza effetti collaterali (usato anche
    nei test per resettare la config se necessario).
    """
    is_prod = settings.ENV == "production"

    # stdlib logging: handler unico su stdout, livello INFO.
    root = logging.getLogger()
    root.handlers = []  # idempotenza
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    # Silenzia il rumore di uvicorn.access per ridondanza con il nostro middleware.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        _add_request_id,
        _mask_secrets,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if is_prod:
        renderer: Any = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=False)

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Helper: restituisce un logger structlog già configurato."""
    return structlog.get_logger(name)
