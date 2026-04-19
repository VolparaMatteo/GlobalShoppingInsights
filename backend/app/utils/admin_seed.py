"""Risoluzione della password admin per il seed iniziale.

Se `settings.ADMIN_PASSWORD` è ancora al valore di default, ne generiamo una
random e segnaliamo al chiamante che va stampata/salvata una volta sola.
"""

from __future__ import annotations

import secrets

from app.config import settings

_DEFAULT_ADMIN_PASSWORD = "admin123"  # noqa: S105 — costante usata solo per confronto


def resolve_admin_password() -> tuple[str, bool]:
    """Ritorna `(password, was_generated)`.

    - Se `ADMIN_PASSWORD` è al default `admin123`, genera una password random
      con `secrets.token_urlsafe(18)` (≈24 caratteri, sicura) e `was_generated=True`.
    - Altrimenti usa la password dell'env così com'è e `was_generated=False`.
    """
    if settings.ADMIN_PASSWORD == _DEFAULT_ADMIN_PASSWORD:
        return secrets.token_urlsafe(18), True
    return settings.ADMIN_PASSWORD, False
