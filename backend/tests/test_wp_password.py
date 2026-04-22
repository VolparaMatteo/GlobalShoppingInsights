"""Test end-to-end della cifratura della password WordPress."""

from __future__ import annotations


def test_wp_password_is_encrypted_on_save(client, auth_headers, db):
    """Il PATCH /settings/wordpress cifra la password prima di persisterla."""
    from app.models.wordpress import WPConfig
    from app.utils.encryption import decrypt, is_encrypted

    response = client.patch(
        "/api/v1/settings/wordpress",
        headers=auth_headers,
        json={
            "wp_url": "https://example.com",
            "wp_username": "wp-user",
            "wp_app_password": "super-secret-wp-pwd",
        },
    )
    assert response.status_code == 200, response.text

    cfg = db.query(WPConfig).filter(WPConfig.id == 1).first()
    assert cfg is not None
    stored = cfg.wp_app_password_encrypted
    assert stored is not None
    assert stored != "super-secret-wp-pwd"
    assert is_encrypted(stored)
    assert decrypt(stored) == "super-secret-wp-pwd"


def test_response_hides_password_but_flags_presence(client, auth_headers, db):
    """GET /settings/wordpress non restituisce la password, solo has_password=True."""
    client.patch(
        "/api/v1/settings/wordpress",
        headers=auth_headers,
        json={
            "wp_url": "https://example.com",
            "wp_username": "wp-user",
            "wp_app_password": "secret",
        },
    )
    response = client.get("/api/v1/settings/wordpress", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["has_password"] is True
    assert "wp_app_password" not in body
    assert "wp_app_password_encrypted" not in body


def test_legacy_plaintext_is_migrated(db):
    """La funzione di migrazione cifra record plaintext esistenti ed è idempotente."""
    from app.models.wordpress import WPConfig
    from app.utils.encryption import decrypt, is_encrypted, migrate_plaintext_passwords

    cfg = WPConfig(
        id=1,
        wp_url="https://example.com",
        wp_username="u",
        wp_app_password_encrypted="legacy-plain-pwd",
    )
    db.add(cfg)
    db.commit()

    # Prima run: cifra.
    assert migrate_plaintext_passwords(db) == 1

    db.refresh(cfg)
    assert is_encrypted(cfg.wp_app_password_encrypted)
    assert decrypt(cfg.wp_app_password_encrypted) == "legacy-plain-pwd"

    # Seconda run: nessun cambiamento.
    assert migrate_plaintext_passwords(db) == 0


def test_wp_service_decrypts_password(db):
    """_wp_auth_credentials restituisce la password in chiaro dal campo cifrato."""
    from app.models.wordpress import WPConfig
    from app.services.wordpress_service import _wp_auth_credentials
    from app.utils.encryption import encrypt

    cfg = WPConfig(
        id=1,
        wp_url="https://example.com",
        wp_username="wp-user",
        wp_app_password_encrypted=encrypt("my-wp-pwd"),
    )
    db.add(cfg)
    db.commit()

    user, pwd = _wp_auth_credentials(cfg)
    assert user == "wp-user"
    assert pwd == "my-wp-pwd"


def test_wp_service_falls_back_to_legacy_plaintext(db):
    """Retrocompatibilità: se nel DB c'è plaintext, viene usato (con warning logger)."""
    from app.models.wordpress import WPConfig
    from app.services.wordpress_service import _wp_auth_credentials

    cfg = WPConfig(
        id=1,
        wp_url="https://example.com",
        wp_username="wp-user",
        wp_app_password_encrypted="legacy-plain-pwd",
    )
    db.add(cfg)
    db.commit()

    user, pwd = _wp_auth_credentials(cfg)
    assert user == "wp-user"
    assert pwd == "legacy-plain-pwd"
