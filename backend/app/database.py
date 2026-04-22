"""Engine SQLAlchemy + session factory.

Supporta SQLite (dev) e PostgreSQL (prod). Per PG configuriamo un pool di
connessioni con pre-ping (verifica connessione prima dell'uso) e recycle
orario per evitare connessioni stale.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _engine_kwargs(url: str) -> dict[str, Any]:
    if url.startswith("sqlite"):
        # SQLite: check_same_thread=False permette l'uso con TestClient + threads.
        return {
            "connect_args": {"check_same_thread": False},
            "echo": False,
        }
    # Altri dialect (PostgreSQL, MySQL, ...): pool robusto per long-running app.
    return {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,  # verifica la connessione prima di usarla
        "pool_recycle": 3600,  # ricicla connessioni ogni ora (anti-stale)
        "echo": False,
    }


engine = create_engine(settings.DATABASE_URL, **_engine_kwargs(settings.DATABASE_URL))


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):  # type: ignore[no-untyped-def]
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
