"""Middleware che assegna un Request-ID unico a ogni richiesta HTTP.

- Se il client invia `X-Request-ID`, viene riutilizzato (utile per correlare
  log lato gateway / Traefik / chiamanti esterni).
- Altrimenti viene generato un UUID4.
- Il valore viene propagato in `request_id_var` così che tutti i log emessi
  durante la gestione della request contengano automaticamente il campo
  `request_id`.
- Viene aggiunto come header `X-Request-ID` della risposta.
"""

from __future__ import annotations

import re
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.utils.logging import request_id_var

# Accettiamo solo caratteri "safe" per evitare header injection o log pollution.
_SAFE_RE = re.compile(r"^[A-Za-z0-9\-_.]{1,128}$")


def _pick_request_id(incoming: str | None) -> str:
    if incoming and _SAFE_RE.match(incoming):
        return incoming
    return str(uuid.uuid4())


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        rid = _pick_request_id(request.headers.get("X-Request-ID"))
        token = request_id_var.set(rid)
        try:
            response: Response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers["X-Request-ID"] = rid
        return response
