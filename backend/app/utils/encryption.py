"""Fernet-based encryption utility for sensitive data (es. WP app password).

La chiave Fernet viene derivata da `settings.WP_ENCRYPTION_KEY`:
- se è già una chiave Fernet valida (32 byte urlsafe-base64) viene usata verbatim;
- altrimenti viene derivata via SHA-256 sul valore, e poi codificata urlsafe-b64.
Questo permette di accettare sia chiavi "propriamente" generate
(`Fernet.generate_key()`) sia passphrase arbitrarie.
"""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


def _derive_key(secret: str) -> bytes:
    if not secret:
        raise RuntimeError("WP_ENCRYPTION_KEY is empty — cannot encrypt/decrypt")

    try:
        raw = base64.urlsafe_b64decode(secret.encode("ascii"))
        if len(raw) == 32:
            return secret.encode("ascii")
    except ValueError:
        # Il secret non è una chiave Fernet: deriviamola via SHA-256 qui sotto.
        pass

    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet() -> Fernet:
    return Fernet(_derive_key(settings.WP_ENCRYPTION_KEY))


def encrypt(plaintext: str) -> str:
    """Cifra `plaintext`. Stringa vuota -> stringa vuota."""
    if not plaintext:
        return ""
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("ascii")


def decrypt(token: str) -> str:
    """Decifra un token Fernet. Solleva `InvalidToken` se non valido."""
    if not token:
        return ""
    return _fernet().decrypt(token.encode("ascii")).decode("utf-8")


def is_encrypted(value: str | None) -> bool:
    """True se `value` è un token Fernet decifrabile con la chiave corrente."""
    if not value:
        return False
    try:
        _fernet().decrypt(value.encode("ascii"))
    except (InvalidToken, ValueError, TypeError):
        return False
    return True
