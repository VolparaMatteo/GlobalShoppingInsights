"""Emissione di eventi di audit su tabella `audit_logs`.

Il helper `emit` è intenzionalmente "dumb": aggiunge un record alla sessione
ma NON committa — è il router a gestire la transazione (un commit unico per
tutta la request). Per eventi che devono sopravvivere al rollback di una
request (es. `login_failed`) il caller deve committare esplicitamente prima
di sollevare l'HTTPException.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.logs import AuditLog


def emit(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    entity: str,
    entity_id: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        metadata_=metadata,
    )
    db.add(log)
    return log
