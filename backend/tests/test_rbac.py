"""Test RBAC comprehensive sugli endpoint critici.

Strategia: per ogni endpoint rate-sensibile, facciamo girare la richiesta con
TUTTI i 5 ruoli. Se il ruolo è in `allowed_roles` ci aspettiamo status != 403
(tipicamente 200/201/404/400 — dipende se entity esiste). Se NON è in
`allowed_roles`, ci aspettiamo 403.

Le dependency `require_role` / `require_min_role` di FastAPI girano PRIMA
del body dell'handler: quindi il 403 è immediato anche se l'entity richiesta
non esiste nel DB.
"""

from __future__ import annotations

import pytest

ALL_ROLES = ["admin", "editor", "reviewer", "contributor", "read_only"]


# Ogni tupla: (method, url, body_or_None, allowed_roles_set)
# Gli URL usano ID inesistenti (999): se il ruolo è OK vedremo 404/400,
# se è insufficiente vedremo 403. Il test verifica SOLO la differenza
# 403 vs non-403.
RBAC_MATRIX = [
    # --- Users (solo admin) ---
    ("GET", "/api/v1/users", None, {"admin"}),
    ("POST", "/api/v1/users", {
        "email": "x@x.com", "name": "X", "password": "strong-password-1234",
    }, {"admin"}),
    ("GET", "/api/v1/users/999", None, {"admin"}),
    ("PATCH", "/api/v1/users/999", {"name": "Y"}, {"admin"}),
    ("DELETE", "/api/v1/users/999", None, {"admin"}),

    # --- Prompts ---
    # create: contributor+
    ("POST", "/api/v1/prompts", {
        "title": "P", "keywords": ["x"], "language": "en",
    }, {"contributor", "editor", "reviewer", "admin"}),
    # patch: contributor+
    ("PATCH", "/api/v1/prompts/999", {"title": "Z"},
     {"contributor", "editor", "reviewer", "admin"}),
    # delete: editor+
    ("DELETE", "/api/v1/prompts/999", None, {"editor", "reviewer", "admin"}),
    # run: contributor+
    ("POST", "/api/v1/prompts/999/run", None,
     {"contributor", "editor", "reviewer", "admin"}),

    # --- Articles ---
    # update: editor+
    ("PATCH", "/api/v1/articles/999", {"title": "T"},
     {"editor", "reviewer", "admin"}),
    # batch: editor+
    ("POST", "/api/v1/articles/batch", {
        "action": "discard", "article_ids": [999],
    }, {"editor", "reviewer", "admin"}),

    # --- Publish (editor+) ---
    ("POST", "/api/v1/publish/999", None, {"editor", "reviewer", "admin"}),
    ("POST", "/api/v1/publish/999/retry", None, {"editor", "reviewer", "admin"}),

    # --- Settings (admin) ---
    ("GET", "/api/v1/settings/wordpress", None, {"admin"}),
    ("PATCH", "/api/v1/settings/wordpress", {"wp_url": "x"}, {"admin"}),
    ("GET", "/api/v1/settings/blacklist", None, {"admin"}),
    ("POST", "/api/v1/settings/blacklist", {"domain": "x.com"}, {"admin"}),

    # --- Audit logs (admin) ---
    ("GET", "/api/v1/audit-logs", None, {"admin"}),

    # --- Taxonomy (admin-only per sync/delete? verifichiamo CRUD) ---
    # Il codice attuale di taxonomy.py userà require_min_role — verifichiamo con tutti
    # e calibriamo: per ora assumiamo editor+ per write, tutti-loggati per read.
]


def _ensure_all_role_users(user_factory) -> None:
    """Crea un utente per ciascun ruolo con email 'role-rbac@test.com'."""
    for role in ALL_ROLES:
        user_factory(role=role, email=f"{role}-rbac@test.com")


@pytest.mark.parametrize("method,url,body,allowed_roles", RBAC_MATRIX)
def test_rbac_matrix(client, user_factory, headers_for, method, url, body, allowed_roles) -> None:
    _ensure_all_role_users(user_factory)

    for role in ALL_ROLES:
        h = headers_for(f"{role}-rbac@test.com")
        kwargs: dict = {"headers": h}
        if body is not None:
            kwargs["json"] = body
        r = client.request(method, url, **kwargs)

        if role in allowed_roles:
            assert r.status_code != 403, (
                f"{role} dovrebbe poter accedere a {method} {url} "
                f"(got {r.status_code}: {r.text[:120]})"
            )
        else:
            assert r.status_code == 403, (
                f"{role} NON dovrebbe poter accedere a {method} {url} "
                f"(got {r.status_code}: {r.text[:120]})"
            )


# ----------------------------------------------------------------------
# Test dedicati per endpoint che richiedono setup ad hoc
# ----------------------------------------------------------------------


def test_unauthenticated_requests_blocked(client) -> None:
    """Senza Authorization header, endpoint protetti restituiscono 401/403."""
    # GET /users (admin-only, autenticato)
    r = client.get("/api/v1/users")
    assert r.status_code in (401, 403)

    # POST /prompts (autenticato)
    r = client.post("/api/v1/prompts", json={"title": "X", "keywords": [], "language": "en"})
    assert r.status_code in (401, 403)


def test_invalid_bearer_token_rejected(client) -> None:
    r = client.get(
        "/api/v1/users",
        headers={"Authorization": "Bearer not-a-real-jwt"},
    )
    assert r.status_code == 401


def test_expired_token_rejected(client, user_factory, db) -> None:
    """Un JWT expired non deve essere accettato."""
    from datetime import datetime, timedelta, timezone

    from jose import jwt

    from app.config import settings

    user = user_factory(role="admin", email="exp@test.com")
    payload = {
        "sub": str(user.id),
        "role": "admin",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),  # scaduto
        "type": "access",
    }
    expired = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    r = client.get("/api/v1/users", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_deactivated_user_cannot_access(client, user_factory, headers_for, db) -> None:
    """Un utente con is_active=False non deve poter accedere neanche con token valido."""
    from app.models.user import User

    user_factory(role="admin", email="dis@test.com", is_active=True)
    h = headers_for("dis@test.com")

    # Disattivo l'utente dopo aver ottenuto il token
    user = db.query(User).filter(User.email == "dis@test.com").first()
    user.is_active = False
    db.commit()

    r = client.get("/api/v1/users", headers=h)
    assert r.status_code == 401
