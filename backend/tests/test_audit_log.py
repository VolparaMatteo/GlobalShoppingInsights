"""Test dell'emissione e della consultazione degli audit log."""

from __future__ import annotations


def _fetch_logs(client, headers, **params):
    r = client.get("/api/v1/audit-logs", headers=headers, params=params)
    assert r.status_code == 200, r.text
    return r.json()["items"]


def test_login_success_emits_audit(client, admin_user, auth_headers) -> None:
    # auth_headers fixture invoca login una volta; controlliamo il log.
    logs = _fetch_logs(client, auth_headers, action="login")
    assert len(logs) >= 1
    log = logs[0]
    assert log["action"] == "login"
    assert log["entity"] == "user"
    assert log["user_id"] == admin_user.id
    assert log["entity_id"] == admin_user.id


def test_login_failure_emits_audit(client, admin_user, auth_headers) -> None:
    client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrong-password"},
    )
    logs = _fetch_logs(client, auth_headers, action="login.failed")
    assert len(logs) >= 1
    assert logs[0]["audit_metadata"]["email"] == "admin@test.com"


def test_login_failure_for_unknown_user_also_logged(client, admin_user, auth_headers) -> None:
    client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@nowhere.test", "password": "x"},
    )
    logs = _fetch_logs(client, auth_headers, action="login.failed")
    ghost_logs = [l for l in logs if l["audit_metadata"]["email"] == "ghost@nowhere.test"]
    assert len(ghost_logs) >= 1
    assert ghost_logs[0]["user_id"] is None


def test_user_create_emits_audit(client, admin_user, auth_headers) -> None:
    r = client.post(
        "/api/v1/users",
        headers=auth_headers,
        json={
            "email": "new@test.com",
            "name": "New",
            "password": "strong-password-1234",
            "role": "editor",
        },
    )
    assert r.status_code == 201, r.text
    new_user_id = r.json()["id"]

    logs = _fetch_logs(client, auth_headers, action="user.create")
    match = [l for l in logs if l["entity_id"] == new_user_id]
    assert len(match) == 1
    assert match[0]["user_id"] == admin_user.id
    assert match[0]["audit_metadata"]["role"] == "editor"


def test_user_role_change_emits_separate_audit(client, admin_user, auth_headers) -> None:
    created = client.post(
        "/api/v1/users",
        headers=auth_headers,
        json={
            "email": "promote@test.com",
            "name": "P",
            "password": "strong-password-1234",
            "role": "contributor",
        },
    ).json()

    client.patch(
        f"/api/v1/users/{created['id']}",
        headers=auth_headers,
        json={"role": "editor"},
    )

    role_logs = _fetch_logs(client, auth_headers, action="user.role_change")
    match = [l for l in role_logs if l["entity_id"] == created["id"]]
    assert len(match) == 1
    meta = match[0]["audit_metadata"]
    assert meta["from"] == "contributor"
    assert meta["to"] == "editor"


def test_audit_logs_require_admin(client, db) -> None:
    """Utenti non-admin non possono leggere gli audit log."""
    from app.models.user import User
    from app.utils.security import hash_password

    editor = User(
        email="editor@test.com",
        name="Editor",
        password_hash=hash_password("testpass123"),
        role="editor",
        is_active=True,
    )
    db.add(editor)
    db.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "editor@test.com", "password": "testpass123"},
    )
    token = login.json()["access_token"]

    r = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_wp_config_update_emits_audit(client, admin_user, auth_headers) -> None:
    client.patch(
        "/api/v1/settings/wordpress",
        headers=auth_headers,
        json={"wp_url": "https://my-wp.com", "wp_username": "u", "wp_app_password": "pw-secret"},
    )
    logs = _fetch_logs(client, auth_headers, action="wp_config.update")
    assert len(logs) >= 1
    fields = logs[0]["audit_metadata"]["fields"]
    assert "wp_url" in fields
    assert "wp_app_password" in fields
