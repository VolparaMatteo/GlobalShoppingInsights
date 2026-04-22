"""Test del middleware di security headers."""

from __future__ import annotations


def test_security_headers_on_api_response(client, admin_user, auth_headers) -> None:
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200

    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert "Referrer-Policy" in r.headers
    assert "Permissions-Policy" in r.headers
    assert "Content-Security-Policy" in r.headers


def test_hsts_absent_in_test_env(client, admin_user, auth_headers) -> None:
    """HSTS deve comparire SOLO in ENV=production."""
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert "Strict-Transport-Security" not in r.headers


def test_no_csp_on_docs_path(client) -> None:
    """Swagger UI (/docs) ha bisogno di inline script — non applichiamo CSP."""
    r = client.get("/docs")
    assert "Content-Security-Policy" not in r.headers


def test_no_csp_on_openapi_json(client) -> None:
    """Anche /openapi.json è esentato (servito a Swagger UI)."""
    r = client.get("/openapi.json")
    assert "Content-Security-Policy" not in r.headers


def test_headers_present_on_error_responses(client) -> None:
    """Gli header di sicurezza si applicano anche alle risposte 401/404."""
    r = client.get("/api/v1/auth/me")  # senza auth → 401/403
    assert r.status_code in (401, 403)
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
