"""Password policy validator sui schemi UserCreate / UserUpdate."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.user import MIN_PASSWORD_LENGTH, UserCreate, UserUpdate


def test_create_accepts_strong_password() -> None:
    user = UserCreate(
        email="new@test.com",
        name="New User",
        password="strong-password-123!",
    )
    assert user.password == "strong-password-123!"


def test_create_rejects_short_password() -> None:
    with pytest.raises(ValidationError, match="troppo corta"):
        UserCreate(email="new@test.com", name="N", password="short")


def test_create_rejects_at_boundary() -> None:
    """La lunghezza minima è esclusiva: `MIN-1` caratteri vengono rigettati."""
    just_short = "a" * (MIN_PASSWORD_LENGTH - 1)
    with pytest.raises(ValidationError, match="troppo corta"):
        UserCreate(email="new@test.com", name="N", password=just_short)


def test_create_accepts_at_boundary() -> None:
    """Esattamente `MIN` caratteri passa."""
    exactly = "a" * MIN_PASSWORD_LENGTH
    user = UserCreate(email="new@test.com", name="N", password=exactly)
    assert user.password == exactly


def test_create_rejects_common_password() -> None:
    with pytest.raises(ValidationError, match="debole"):
        UserCreate(email="new@test.com", name="N", password="admin1234")


def test_create_rejects_password_with_leading_trailing_spaces() -> None:
    with pytest.raises(ValidationError, match="spazi"):
        UserCreate(
            email="new@test.com",
            name="N",
            password=" strong-password-123! ",
        )


def test_update_allows_no_password() -> None:
    update = UserUpdate(name="New Name")
    assert update.password is None


def test_update_rejects_short_password() -> None:
    with pytest.raises(ValidationError, match="troppo corta"):
        UserUpdate(password="short")


def test_update_accepts_strong_password() -> None:
    update = UserUpdate(password="another-strong-pass-42")
    assert update.password == "another-strong-pass-42"
