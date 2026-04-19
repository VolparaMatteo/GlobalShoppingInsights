"""Smoke test del rate limiter.

In ENV=test il limiter è disabilitato (vedi app.utils.rate_limit): questi test
verificano solo che l'integrazione con FastAPI non rompa i flow esistenti.
Un test che effettivamente trigghera il limit richiede Redis/production e
verrà aggiunto in Sprint 3 quando avremo un container di staging.
"""

from __future__ import annotations


def test_limiter_disabled_in_test_env() -> None:
    from app.utils.rate_limit import limiter

    assert limiter.enabled is False


def test_login_still_works_with_limiter_installed(client, admin_user) -> None:
    """Il decorator non deve alterare la risposta in modalità test."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "testpass123"},
    )
    assert r.status_code == 200


def test_many_logins_do_not_trigger_limit_in_test(client, admin_user) -> None:
    """Con limiter disabilitato, 10 login consecutivi passano tutti."""
    for _ in range(10):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@test.com", "password": "testpass123"},
        )
        assert r.status_code == 200
