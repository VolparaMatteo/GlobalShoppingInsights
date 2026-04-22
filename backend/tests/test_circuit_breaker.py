"""Test del CircuitBreaker generico (app/utils/circuit_breaker.py)."""

from __future__ import annotations

import time

import pytest

from app.utils.circuit_breaker import CircuitBreaker, CircuitState


def test_starts_closed():
    cb = CircuitBreaker(name="test")
    assert cb.state == CircuitState.CLOSED
    assert not cb.is_open()


def test_failures_under_threshold_stay_closed():
    cb = CircuitBreaker(name="test", failure_threshold=3)
    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    assert cb.snapshot()["failures"] == 2


def test_opens_at_threshold():
    cb = CircuitBreaker(name="test", failure_threshold=3)
    cb.record_failure()
    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    assert cb.is_open()


def test_success_resets_failures_and_closes():
    cb = CircuitBreaker(name="test", failure_threshold=3)
    cb.record_failure()
    cb.record_failure()
    cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb.snapshot()["failures"] == 0


def test_transitions_to_half_open_after_timeout():
    """Dopo reset_timeout, OPEN → HALF_OPEN automatico alla lettura di .state."""
    cb = CircuitBreaker(name="test", failure_threshold=1, reset_timeout=0.1)
    cb.record_failure()
    assert cb.is_open()
    time.sleep(0.15)
    assert cb.state == CircuitState.HALF_OPEN


def test_success_from_half_open_closes():
    cb = CircuitBreaker(name="test", failure_threshold=1, reset_timeout=0.1)
    cb.record_failure()
    time.sleep(0.15)
    # Prova una nuova richiesta che va bene → chiude
    cb.record_success()
    assert cb.state == CircuitState.CLOSED


def test_failure_from_half_open_reopens():
    cb = CircuitBreaker(name="test", failure_threshold=1, reset_timeout=0.1)
    cb.record_failure()
    time.sleep(0.15)
    _ = cb.state  # trigger transizione HALF_OPEN
    # Prova fallisce → riapre immediatamente (supera threshold di nuovo)
    cb.record_failure()
    assert cb.state == CircuitState.OPEN


def test_snapshot_structure():
    cb = CircuitBreaker(name="ollama", failure_threshold=3, reset_timeout=300.0)
    snap = cb.snapshot()
    assert snap["name"] == "ollama"
    assert snap["state"] == "closed"
    assert snap["failures"] == 0
    assert snap["opened_at"] is None
    assert snap["reset_timeout"] == 300.0
    assert snap["failure_threshold"] == 3


@pytest.mark.parametrize("threshold", [1, 3, 5, 10])
def test_custom_threshold(threshold: int):
    cb = CircuitBreaker(name="test", failure_threshold=threshold)
    for _ in range(threshold - 1):
        cb.record_failure()
    assert not cb.is_open()
    cb.record_failure()
    assert cb.is_open()
