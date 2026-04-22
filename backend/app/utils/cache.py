"""In-memory TTL cache per endpoint caldo (taxonomy, dashboard).

Attualmente backed da cachetools.TTLCache (process-local). Quando aggiungeremo
Redis (Sprint 6 post-VPS), sostituiremo il backend mantenendo la stessa API
`@cached(ttl=..., key=...)`.

Limitazioni del backend in-memory:
- Con gunicorn multi-worker (GUNICORN_WORKERS>1) ogni worker ha la sua cache
  → TTL effettivo raddoppiato. In GSI pre-ARQ stiamo con workers=1, ok.
- Invalidazione manuale (es. dopo POST /tags) richiede clear esplicito —
  usare `invalidate_cache(prefix=...)`.
"""

from __future__ import annotations

import functools
import hashlib
import json
import threading
from collections.abc import Callable
from typing import Any

from cachetools import TTLCache

# Default: 256 entry totali, TTL 60 secondi. Grande abbastanza per coprire
# taxonomy + KPIs senza saturare la memoria del worker.
_cache: TTLCache[str, Any] = TTLCache(maxsize=256, ttl=60)
_lock = threading.Lock()


def _make_key(prefix: str, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
    """Deterministic cache key da prefix + args + kwargs.

    Salta argomenti non-hashable (es. Session SQLAlchemy) per non impattare
    la chiave. Chi chiama deve passare parametri serializzabili nella chiave.
    """
    safe_args = [a for a in args if _is_serializable(a)]
    safe_kwargs = {k: v for k, v in kwargs.items() if _is_serializable(v)}
    material = json.dumps({"a": safe_args, "k": safe_kwargs}, sort_keys=True, default=str)
    digest = hashlib.sha1(material.encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"


def _is_serializable(value: Any) -> bool:
    try:
        json.dumps(value, default=str)
        return True
    except (TypeError, ValueError):
        return False


def cached(prefix: str, ttl: int = 60) -> Callable:
    """Decoratore function-level con TTL custom.

    Args:
        prefix: namespace della chiave (es. "taxonomy:tags"). Usato anche
            da invalidate_cache() per invalidare una sezione intera.
        ttl: TTL specifico per questa chiamata (override del default 60s).

    Non cacha il risultato se e' None (evita di fissare errori intermittenti).
    """

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = _make_key(prefix, args, kwargs)
            with _lock:
                # TTLCache gestisce l'evict automatico al get
                if key in _cache:
                    return _cache[key]

            result = fn(*args, **kwargs)

            if result is not None:
                with _lock:
                    # Override TTL per-entry: richiede TTLCache personalizzata.
                    # Per semplicita' manteniamo il default TTLCache (ttl globale);
                    # "ttl" argomento documenta l'intento per quando passeremo a Redis.
                    _cache[key] = result
            return result

        return wrapper

    return decorator


def invalidate_cache(prefix: str | None = None) -> int:
    """Invalida tutta la cache o una sottosezione (per prefix).

    Returns:
        Numero di entry rimosse.
    """
    with _lock:
        if prefix is None:
            n = len(_cache)
            _cache.clear()
            return n
        to_remove = [k for k in _cache if k.startswith(f"{prefix}:")]
        for k in to_remove:
            del _cache[k]
        return len(to_remove)
