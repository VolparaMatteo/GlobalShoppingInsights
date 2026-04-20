"""Test della configurazione dell'engine SQLAlchemy per vari dialect."""

from __future__ import annotations

from app.database import _engine_kwargs


def test_sqlite_engine_kwargs() -> None:
    kwargs = _engine_kwargs("sqlite:///./gsi.db")
    assert kwargs["connect_args"] == {"check_same_thread": False}
    assert "pool_size" not in kwargs  # SQLite non usa pool


def test_postgres_engine_kwargs() -> None:
    kwargs = _engine_kwargs("postgresql+psycopg://user:pass@localhost/db")
    assert kwargs["pool_size"] == 5
    assert kwargs["max_overflow"] == 10
    assert kwargs["pool_pre_ping"] is True
    assert kwargs["pool_recycle"] == 3600
    assert "connect_args" not in kwargs


def test_mysql_engine_kwargs_non_sqlite_path() -> None:
    """Dialect non-SQLite prende la config pool anche se non è Postgres."""
    kwargs = _engine_kwargs("mysql+pymysql://u:p@h/d")
    assert kwargs["pool_size"] == 5
