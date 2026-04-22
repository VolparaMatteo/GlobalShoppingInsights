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


def migrate_plaintext_passwords(db=None) -> int:  # type: ignore[no-untyped-def]
    """Migrazione idempotente: cifra le WP password salvate in plaintext.

    Passando una sessione SQLAlchemy (`db`) la migrazione agisce su quella,
    altrimenti ne apre una nuova (comportamento lifespan). Ritorna il numero
    di record migrati (0 se già tutti cifrati). Sprint 2 sposterà questa
    logica in una migrazione Alembic dedicata.
    """
    # Import locali per evitare cicli (encryption è utility di basso livello,
    # i modelli importano config via Base).
    from app.database import SessionLocal
    from app.models.wordpress import WPConfig

    owns_session = db is None
    if owns_session:
        db = SessionLocal()

    migrated = 0
    try:
        configs = db.query(WPConfig).filter(WPConfig.wp_app_password_encrypted.isnot(None)).all()
        for cfg in configs:
            pwd = cfg.wp_app_password_encrypted
            if pwd and not is_encrypted(pwd):
                cfg.wp_app_password_encrypted = encrypt(pwd)
                migrated += 1
        if migrated:
            db.commit()
        return migrated
    finally:
        if owns_session:
            db.close()
