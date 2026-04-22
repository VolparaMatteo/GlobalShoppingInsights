"""Test del decorator `with_retry`."""

from __future__ import annotations

from unittest.mock import MagicMock

import httpx
import pytest

from app.utils.retry import _is_retryable_http_status, with_retry


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_succeeds_on_first_try(monkeypatch):
    sleep = MagicMock()
    monkeypatch.setattr("app.utils.retry.time.sleep", sleep)

    calls = {"n": 0}

    @with_retry()
    def ok() -> str:
        calls["n"] += 1
        return "done"

    assert ok() == "done"
    assert calls["n"] == 1
    sleep.assert_not_called()


def test_retries_on_timeout_then_succeeds(monkeypatch):
    sleep = MagicMock()
    monkeypatch.setattr("app.utils.retry.time.sleep", sleep)

    calls = {"n": 0}

    @with_retry(max_attempts=3, initial_delay=0.5, backoff=2.0)
    def flaky() -> str:
        calls["n"] += 1
        if calls["n"] < 3:
            raise httpx.TimeoutException("boom")
        return "ok"

    assert flaky() == "ok"
    assert calls["n"] == 3
    assert sleep.call_count == 2
    # Backoff: prima attesa 0.5, seconda 1.0
    assert sleep.call_args_list[0].args[0] == pytest.approx(0.5)
    assert sleep.call_args_list[1].args[0] == pytest.approx(1.0)


def test_retries_exhausted_raises_last_exception(monkeypatch):
    monkeypatch.setattr("app.utils.retry.time.sleep", lambda *_: None)

    @with_retry(max_attempts=3, initial_delay=0.01)
    def always_fails() -> None:
        raise httpx.ConnectError("nope")

    with pytest.raises(httpx.ConnectError):
        always_fails()


# ---------------------------------------------------------------------------
# HTTP status handling
# ---------------------------------------------------------------------------


def _make_status_error(status_code: int) -> httpx.HTTPStatusError:
    req = httpx.Request("GET", "http://test")
    resp = httpx.Response(status_code, request=req)
    return httpx.HTTPStatusError("err", request=req, response=resp)


def test_5xx_http_error_is_retried(monkeypatch):
    sleep = MagicMock()
    monkeypatch.setattr("app.utils.retry.time.sleep", sleep)

    calls = {"n": 0}

    @with_retry(max_attempts=3, initial_delay=0.01)
    def f() -> str:
        calls["n"] += 1
        if calls["n"] < 2:
            raise _make_status_error(503)
        return "ok"

    assert f() == "ok"
    assert calls["n"] == 2
    assert sleep.call_count == 1


def test_4xx_http_error_is_not_retried(monkeypatch):
    monkeypatch.setattr("app.utils.retry.time.sleep", lambda *_: None)

    calls = {"n": 0}

    @with_retry(max_attempts=3, initial_delay=0.01)
    def f() -> None:
        calls["n"] += 1
        raise _make_status_error(404)

    with pytest.raises(httpx.HTTPStatusError):
        f()
    assert calls["n"] == 1  # nessun retry su 4xx


def test_is_retryable_http_status_helper():
    assert _is_retryable_http_status(_make_status_error(500)) is True
    assert _is_retryable_http_status(_make_status_error(502)) is True
    assert _is_retryable_http_status(_make_status_error(599)) is True
    assert _is_retryable_http_status(_make_status_error(400)) is False
    assert _is_retryable_http_status(_make_status_error(404)) is False
    assert _is_retryable_http_status(_make_status_error(499)) is False
    assert _is_retryable_http_status(ValueError("x")) is False


# ---------------------------------------------------------------------------
# Non-retryable exceptions propagate immediatamente
# ---------------------------------------------------------------------------


def test_non_retryable_exception_propagates_without_retry(monkeypatch):
    monkeypatch.setattr("app.utils.retry.time.sleep", lambda *_: None)

    calls = {"n": 0}

    @with_retry(max_attempts=5)
    def f() -> None:
        calls["n"] += 1
        raise ValueError("not transient")

    with pytest.raises(ValueError, match="not transient"):
        f()
    assert calls["n"] == 1


# ---------------------------------------------------------------------------
# Custom retryable tuple
# ---------------------------------------------------------------------------


class _MyTransient(Exception):
    pass


def test_custom_retryable_exceptions(monkeypatch):
    monkeypatch.setattr("app.utils.retry.time.sleep", lambda *_: None)
    calls = {"n": 0}

    @with_retry(max_attempts=3, initial_delay=0.01, retryable=(_MyTransient,))
    def f() -> str:
        calls["n"] += 1
        if calls["n"] < 3:
            raise _MyTransient()
        return "ok"

    assert f() == "ok"
    assert calls["n"] == 3
