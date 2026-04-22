"""Ambiente di esecuzione Alembic per GSI.

- Legge la URL del DB dalle `settings` dell'app (unica sorgente di verità).
- Supporta l'override via `ALEMBIC_DATABASE_URL` (utile per generare la
  baseline su un DB vuoto, o puntare a staging senza toccare .env).
- Abilita `render_as_batch=True` su SQLite: Alembic genera ALTER TABLE
  tramite copia/rinomina, altrimenti non supportato dal dialect.
"""

from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Aggiungi `backend/` al path così gli import di `app.*` funzionano.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings  # noqa: E402
from app.database import Base  # noqa: E402
from app.models import *  # noqa: E402,F401,F403

config = context.config

# Override dell'URL: prima env var (ALEMBIC_DATABASE_URL), poi settings.
config.set_main_option(
    "sqlalchemy.url",
    os.environ.get("ALEMBIC_DATABASE_URL") or settings.DATABASE_URL,
)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=_is_sqlite(url or ""),
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    section = config.get_section(config.config_ini_section, {}) or {}
    connectable = engine_from_config(section, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=_is_sqlite(str(connection.engine.url)),
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
