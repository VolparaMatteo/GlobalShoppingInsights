"""Retry con backoff esponenziale per chiamate a servizi esterni.

Motivazione: scraper, Ollama, WordPress REST API possono fallire per motivi
transitori (timeout, DNS, 502/503 temporaneo). Un singolo retry salva la
maggioranza dei casi senza user impact. Evitiamo `tenacity` per non aggiungere
una dipendenza: l'implementazione è ~40 righe di Python.

Uso:
    from app.utils.retry import with_retry

    @with_retry(max_attempts=3, initial_delay=1.0)
    def fetch(url: str) -> str:
        return httpx.get(url, timeout=10).raise_for_status().text

Convenzioni:
    - Ritentiamo su timeout, connection error, 5xx HTTP, e su qualunque
      eccezione custom passata come `retryable`.
    - NON ritentiamo su 4xx HTTP (errore del chiamante: retry inutile).
"""

from __future__ import annotations

import functools
import time
from collections.abc import Callable
from typing import Any, TypeVar

import httpx

from app.utils.logging import get_logger

_log = get_logger(__name__)
T = TypeVar("T")


_DEFAULT_RETRYABLE: tuple[type[Exception], ...] = (
    httpx.TimeoutException,
    httpx.ConnectError,
    httpx.RemoteProtocolError,
    httpx.ReadError,
    httpx.NetworkError,
)


def _is_retryable_http_status(exc: Exception) -> bool:
    return (
        isinstance(exc, httpx.HTTPStatusError)
        and exc.response is not None
        and exc.response.status_code >= 500
    )


def with_retry(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    backoff: float = 2.0,
    retryable: tuple[type[Exception], ...] | None = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator: riprova una chiamata in caso di errori transitori.

    Args:
        max_attempts: tentativi totali (default 3 → 1 iniziale + 2 retry)
        initial_delay: secondi prima del primo retry (default 1.0)
        backoff: moltiplicatore del delay (default 2.0 → 1s, 2s, 4s, …)
        retryable: eccezioni considerate transitorie. Default: gli errori
            di rete di httpx (timeout, connect, protocol).

    Comportamento:
        - `retryable`: ritentiamo.
        - `HTTPStatusError` con status ≥500: ritentiamo.
        - `HTTPStatusError` con status 4xx: **non** ritentiamo (propaga subito).
        - Qualunque altra eccezione: **non** ritentiamo (propaga subito).

    Sleep usa `time.sleep` (bloccante). Per async usare una variante dedicata
    (non implementata qui: non serve in questa codebase sync).
    """
    effective_retryable = retryable or _DEFAULT_RETRYABLE

    def decorator(fn: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            delay = initial_delay
            last_exc: BaseException | None = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except effective_retryable as exc:
                    last_exc = exc
                    if attempt >= max_attempts:
                        _log.warning(
                            "retry.exhausted",
                            fn=fn.__name__,
                            attempts=attempt,
                            error=type(exc).__name__,
                            message=str(exc)[:200],
                        )
                        raise
                    _log.info(
                        "retry.waiting",
                        fn=fn.__name__,
                        attempt=attempt,
                        next_delay_s=delay,
                        error=type(exc).__name__,
                    )
                    time.sleep(delay)
                    delay *= backoff
                except httpx.HTTPStatusError as exc:
                    if not _is_retryable_http_status(exc) or attempt >= max_attempts:
                        if _is_retryable_http_status(exc):
                            _log.warning(
                                "retry.exhausted",
                                fn=fn.__name__,
                                attempts=attempt,
                                http_status=exc.response.status_code,
                            )
                        raise
                    last_exc = exc
                    _log.info(
                        "retry.waiting",
                        fn=fn.__name__,
                        attempt=attempt,
                        next_delay_s=delay,
                        http_status=exc.response.status_code,
                    )
                    time.sleep(delay)
                    delay *= backoff
            # Raggiunto solo se max_attempts < 1 (config errata)
            if last_exc is not None:
                raise last_exc
            raise RuntimeError("retry loop exited without result (max_attempts < 1?)")

        return wrapper

    return decorator
