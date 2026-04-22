"""Test per RequestIdMiddleware e logging structlog."""

from __future__ import annotations

import io
import json
import logging
import re
import uuid

import structlog

from app.middleware.request_id import _pick_request_id
from app.utils.logging import (
    _mask_secrets,
    configure_logging,
    get_logger,
    request_id_var,
)


# ---------------------------------------------------------------------------
# RequestIdMiddleware
# ---------------------------------------------------------------------------


def test_response_includes_generated_request_id(client):
    r = client.get("/api/v1/health")
    assert "x-request-id" in {k.lower() for k in r.headers.keys()}
    rid = r.headers["x-request-id"]
    # UUID4 hex-with-dashes: 36 caratteri
    assert re.match(r"^[0-9a-f-]{36}$", rid)


def test_response_echoes_client_provided_request_id(client):
    custom = "req-abc-123"
    r = client.get("/api/v1/health", headers={"X-Request-ID": custom})
    assert r.headers["x-request-id"] == custom


def test_malformed_incoming_request_id_is_replaced(client):
    # header con caratteri non-safe → middleware ne genera uno nuovo
    r = client.get("/api/v1/health", headers={"X-Request-ID": "bad id with spaces & $"})
    rid = r.headers["x-request-id"]
    assert rid != "bad id with spaces & $"
    assert re.match(r"^[0-9a-f-]{36}$", rid)


def test_pick_request_id_accepts_safe_values():
    assert _pick_request_id("abc-123") == "abc-123"
    assert _pick_request_id("XYZ.test_45") == "XYZ.test_45"


def test_pick_request_id_generates_uuid_on_invalid_input():
    for bad in (None, "", "a b", "a" * 200, "drop table; --"):
        rid = _pick_request_id(bad)
        uuid.UUID(rid)  # non solleva


# ---------------------------------------------------------------------------
# structlog: PII masking + request_id propagation
# ---------------------------------------------------------------------------


def test_mask_secrets_redacts_sensitive_keys():
    event = {
        "user": "alice",
        "password": "super",
        "wp_app_password": "xxx",
        "api_key": "k",
        "TOKEN": "t",
        "authorization": "Bearer ...",
        "session_secret": "s",
    }
    out = _mask_secrets(None, "info", dict(event))
    assert out["user"] == "alice"
    assert out["password"] == "***"
    assert out["wp_app_password"] == "***"
    assert out["api_key"] == "***"
    assert out["TOKEN"] == "***"
    assert out["authorization"] == "***"
    assert out["session_secret"] == "***"


def test_request_id_appears_in_log_when_contextvar_set(capsys):
    configure_logging()
    log = get_logger("test")
    token = request_id_var.set("test-req-42")
    try:
        log.info("hello world", extra_field="v")
    finally:
        request_id_var.reset(token)

    captured = capsys.readouterr().out
    assert "test-req-42" in captured
    assert "hello world" in captured
    assert "extra_field" in captured


def test_request_id_absent_from_log_without_contextvar(capsys):
    configure_logging()
    log = get_logger("test")
    # ContextVar non settata → nessun request_id nel log
    # (assicuriamoci che una fixture precedente non l'abbia lasciata settata)
    try:
        request_id_var.get()
    except LookupError:
        pass
    log.info("no context")

    captured = capsys.readouterr().out
    assert "no context" in captured
    assert "request_id" not in captured


def test_logged_password_field_is_masked(capsys):
    configure_logging()
    log = get_logger("test")
    log.info("login attempt", email="a@b.com", password="supersegreta")

    captured = capsys.readouterr().out
    assert "supersegreta" not in captured
    assert "***" in captured
