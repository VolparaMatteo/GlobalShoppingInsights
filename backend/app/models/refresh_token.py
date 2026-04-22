"""Refresh token persistenti: permettono la revoca (logout) e la rotazione.

Ogni refresh JWT contiene un `jti` univoco; qui teniamo traccia dei jti emessi
e del loro stato (`revoked_at`) per rifiutare token compromessi o già usati.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    jti = Column(String(36), unique=True, nullable=False, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    issued_at = Column(DateTime, nullable=False, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    @property
    def is_active(self) -> bool:
        if self.revoked_at is not None:
            return False
        # Confronto naive/aware-safe: SQLAlchemy restituisce datetime naive se la
        # colonna non specifica timezone. Trattiamoli entrambi come UTC.
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return expires > now
