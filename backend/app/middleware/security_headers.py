"""Middleware che aggiunge header di sicurezza standard a ogni risposta.

- HSTS: solo in `ENV=production` (richiede HTTPS per essere utile e rompe i
  client di sviluppo su HTTP semplice).
- CSP: applicata a tutti i path eccetto `/docs` e `/redoc` (Swagger UI ha
  bisogno di inline script e risorse CDN).
- Gli altri header sono sempre ON (nessuno dei valori scelti blocca lo sviluppo).
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings

_CSP_API = (
    "default-src 'self'; "
    "img-src 'self' data: https:; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none'"
)

_PERMISSIONS_POLICY = (
    "geolocation=(), camera=(), microphone=(), payment=(), usb=(), "
    "accelerometer=(), gyroscope=(), magnetometer=()"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", _PERMISSIONS_POLICY)

        path = request.url.path
        if not (
            path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi")
        ):
            response.headers.setdefault("Content-Security-Policy", _CSP_API)

        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )

        return response
