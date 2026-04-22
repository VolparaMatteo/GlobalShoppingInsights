"""Smoke test per l'utility di cifratura Fernet."""

from __future__ import annotations

import pytest

from app.utils.encryption import decrypt, encrypt, is_encrypted


def test_roundtrip_preserves_plaintext() -> None:
    token = encrypt("my-wp-password")
    assert token != "my-wp-password"
    assert is_encrypted(token)
    assert decrypt(token) == "my-wp-password"


def test_empty_string_passes_through() -> None:
    assert encrypt("") == ""
    assert decrypt("") == ""
    assert is_encrypted("") is False


def test_plaintext_is_not_detected_as_encrypted() -> None:
    assert is_encrypted("plaintext") is False
    assert is_encrypted("admin123") is False
    assert is_encrypted(None) is False


def test_tokens_are_non_deterministic() -> None:
    """Fernet include un timestamp + IV: due cifrature dello stesso input differiscono."""
    a = encrypt("same-password")
    b = encrypt("same-password")
    assert a != b
    assert decrypt(a) == decrypt(b) == "same-password"


def test_decrypt_invalid_raises() -> None:
    from cryptography.fernet import InvalidToken

    with pytest.raises(InvalidToken):
        decrypt("not-a-valid-fernet-token")
