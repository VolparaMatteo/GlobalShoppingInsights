"""Test della rotazione e revoca dei refresh token."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import settings


LOGIN_PAYLOAD = {"email": "admin@test.com", "password": "testpass123"}


def test_login_issues_access_and_refresh(client, admin_user):
    r = client.post("/api/v1/auth/login", json=LOGIN_PAYLOAD)
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["access_token"] != body["refresh_token"]


def test_refresh_rotation_revokes_old_token(client, admin_user):
    """Dopo un refresh, il token precedente non deve più funzionare."""
    login = client.post("/api/v1/auth/login", json=LOGIN_PAYLOAD)
    old_refresh = login.json()["refresh_token"]

    # Primo refresh: ok, nuovo token diverso.
    r1 = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r1.status_code == 200
    new_refresh = r1.json()["refresh_token"]
    assert new_refresh != old_refresh

    # Riuso del vecchio token: respinto.
    r2 = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r2.status_code == 401
    assert "revoked" in r2.json()["detail"].lower() or "expired" in r2.json()["detail"].lower()

    # Nuovo token: continua a funzionare finché non viene ruotato a sua volta.
    r3 = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert r3.status_code == 200


def test_logout_revokes_refresh(client, admin_user):
    login = client.post("/api/v1/auth/login", json=LOGIN_PAYLOAD)
    refresh = login.json()["refresh_token"]

    logout = client.post("/api/v1/auth/logout", json={"refresh_token": refresh})
    assert logout.status_code == 200

    # Il refresh non è più valido.
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401


def test_logout_is_idempotent(client, admin_user):
    login = client.post("/api/v1/auth/login", json=LOGIN_PAYLOAD)
    refresh = login.json()["refresh_token"]

    client.post("/api/v1/auth/logout", json={"refresh_token": refresh})
    r2 = client.post("/api/v1/auth/logout", json={"refresh_token": refresh})
    # Secondo logout: 200 (refresh token ancora "valido" JWT-wise, solo DB-revoked).
    assert r2.status_code == 200


def test_refresh_token_without_jti_rejected(client, admin_user):
    """Token legacy senza jti (pre-batch-4) vengono rifiutati."""
    payload = {
        "sub": str(admin_user.id),
        "role": admin_user.role,
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
        "type": "refresh",
    }
    legacy_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    r = client.post("/api/v1/auth/refresh", json={"refresh_token": legacy_token})
    assert r.status_code == 401


def test_access_token_cannot_be_used_as_refresh(client, admin_user):
    login = client.post("/api/v1/auth/login", json=LOGIN_PAYLOAD)
    access = login.json()["access_token"]

    r = client.post("/api/v1/auth/refresh", json={"refresh_token": access})
    assert r.status_code == 401
