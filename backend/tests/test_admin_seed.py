"""Test della risoluzione della password admin per il seed."""

from __future__ import annotations

from app.utils.admin_seed import resolve_admin_password


def test_generates_random_when_default(monkeypatch) -> None:
    """Se ADMIN_PASSWORD è al default `admin123`, ne genera una random sicura."""
    from app.config import settings

    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "admin123")

    pwd, was_generated = resolve_admin_password()
    assert was_generated is True
    assert pwd != "admin123"
    assert len(pwd) >= 18


def test_uses_provided_password(monkeypatch) -> None:
    """Se ADMIN_PASSWORD è stato sovrascritto, viene usato così com'è."""
    from app.config import settings

    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "my-strong-admin-pwd")

    pwd, was_generated = resolve_admin_password()
    assert was_generated is False
    assert pwd == "my-strong-admin-pwd"


def test_two_calls_generate_different_random(monkeypatch) -> None:
    """Due chiamate generano password diverse (non deterministiche)."""
    from app.config import settings

    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "admin123")

    p1, _ = resolve_admin_password()
    p2, _ = resolve_admin_password()
    assert p1 != p2
