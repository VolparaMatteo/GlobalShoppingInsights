"""Limiter slowapi condiviso da tutti i router.

Centralizza la configurazione per evitare import circolari e permettere di
disabilitare globalmente il rate limiting nei test (altrimenti test che fanno
più login in sequenza verrebbero bloccati).
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.ENV != "test",
)
