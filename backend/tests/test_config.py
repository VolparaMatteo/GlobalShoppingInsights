"""Test del modello Settings e dei suoi validator di produzione."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_development_accepts_defaults() -> None:
    s = Settings(ENV="development")
    assert s.is_production is False
    assert s.SECRET_KEY.startswith("change-me")


def test_test_env_accepts_defaults() -> None:
    s = Settings(ENV="test")
    assert s.is_production is False


def test_production_happy_path() -> None:
    s = Settings(
        ENV="production",
        SECRET_KEY="a" * 64,
        WP_ENCRYPTION_KEY="b" * 44,
        ADMIN_PASSWORD="a-robust-admin-password!",
        CORS_ORIGINS='["https://client.com"]',
    )
    assert s.is_production is True


def test_production_rejects_default_secret_key() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(
            ENV="production",
            SECRET_KEY="change-me-to-a-random-secret-key",
            WP_ENCRYPTION_KEY="b" * 44,
            ADMIN_PASSWORD="strong-password",
            CORS_ORIGINS='["https://client.com"]',
        )


def test_production_rejects_short_secret_key() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY troppo corta"):
        Settings(
            ENV="production",
            SECRET_KEY="too-short",
            WP_ENCRYPTION_KEY="b" * 44,
            ADMIN_PASSWORD="strong-password",
            CORS_ORIGINS='["https://client.com"]',
        )


def test_production_rejects_default_wp_encryption_key() -> None:
    with pytest.raises(ValidationError, match="WP_ENCRYPTION_KEY"):
        Settings(
            ENV="production",
            SECRET_KEY="a" * 64,
            WP_ENCRYPTION_KEY="change-me-to-a-random-key",
            ADMIN_PASSWORD="strong-password",
            CORS_ORIGINS='["https://client.com"]',
        )


def test_production_rejects_default_admin_password() -> None:
    with pytest.raises(ValidationError, match="ADMIN_PASSWORD"):
        Settings(
            ENV="production",
            SECRET_KEY="a" * 64,
            WP_ENCRYPTION_KEY="b" * 44,
            ADMIN_PASSWORD="admin123",
            CORS_ORIGINS='["https://client.com"]',
        )


def test_production_rejects_localhost_cors() -> None:
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        Settings(
            ENV="production",
            SECRET_KEY="a" * 64,
            WP_ENCRYPTION_KEY="b" * 44,
            ADMIN_PASSWORD="strong-password",
            CORS_ORIGINS='["http://localhost:5173"]',
        )
