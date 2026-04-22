"""
Circuit breaker semplice per servizi esterni (Ollama, WordPress, ...).

Stati:
- CLOSED: normale, le chiamate passano.
- OPEN: troppe failure consecutive → tutte le chiamate falliscono rapidamente
  senza contattare il servizio. Riapre automaticamente dopo `reset_timeout`.
- HALF_OPEN: dopo reset_timeout la prossima chiamata "prova"; se successa
  torna CLOSED, se fallisce torna OPEN per un altro ciclo.

Thread-safe tramite threading.Lock (APScheduler/gunicorn worker single-thread
in-process, ma mettiamo la safety net comunque).
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from enum import Enum


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Circuit breaker per un singolo servizio.

    Args:
        name: Nome logico (es. "ollama") — usato nei log e nell'health endpoint.
        failure_threshold: N failure consecutive prima di aprire il circuito.
        reset_timeout: Secondi di attesa in OPEN prima di passare a HALF_OPEN.
    """

    name: str
    failure_threshold: int = 3
    reset_timeout: float = 300.0  # 5 minuti

    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _failures: int = field(default=0, init=False)
    _opened_at: float = field(default=0.0, init=False)
    _lock: threading.Lock = field(default_factory=threading.Lock, init=False)

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------
    @property
    def state(self) -> CircuitState:
        """Stato corrente (con auto-transizione OPEN → HALF_OPEN se timeout scaduto)."""
        with self._lock:
            if self._state == CircuitState.OPEN and self._timeout_elapsed():
                self._state = CircuitState.HALF_OPEN
            return self._state

    def is_open(self) -> bool:
        """True se il circuito è OPEN (chiamate vanno skippate)."""
        return self.state == CircuitState.OPEN

    def snapshot(self) -> dict:
        """Rappresentazione serializzabile per /health e debug."""
        with self._lock:
            return {
                "name": self.name,
                "state": self._state.value,
                "failures": self._failures,
                "opened_at": self._opened_at or None,
                "reset_timeout": self.reset_timeout,
                "failure_threshold": self.failure_threshold,
            }

    # ------------------------------------------------------------------
    # Mutation
    # ------------------------------------------------------------------
    def record_success(self) -> None:
        """Una chiamata è andata bene — resetta contatori e chiudi."""
        with self._lock:
            self._failures = 0
            self._state = CircuitState.CLOSED
            self._opened_at = 0.0

    def record_failure(self) -> None:
        """Una chiamata è fallita — incrementa contatore, apri se sopra soglia."""
        with self._lock:
            self._failures += 1
            if self._failures >= self.failure_threshold:
                self._state = CircuitState.OPEN
                self._opened_at = time.monotonic()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _timeout_elapsed(self) -> bool:
        return bool(self._opened_at) and (time.monotonic() - self._opened_at >= self.reset_timeout)
