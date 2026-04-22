"""Application settings — caricati da .env.

In modalità `production` un set di validator rifiuta l'avvio
se SECRET_KEY / WP_ENCRYPTION_KEY / ADMIN_PASSWORD sono ancora ai valori
di default, o se CORS_ORIGINS contiene localhost.
"""

from __future__ import annotations

import json
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings

_DEFAULT_SECRET_KEY = "change-me-to-a-random-secret-key"
_DEFAULT_WP_ENCRYPTION_KEY = "change-me-to-a-random-key"
_DEFAULT_ADMIN_PASSWORD = "admin123"  # noqa: S105 — costante per il confronto nel validator


class Settings(BaseSettings):
    # Profilo d'ambiente — attiva i validator di produzione
    ENV: Literal["development", "production", "test"] = "development"

    DATABASE_URL: str = "sqlite:///./gsi.db"

    SECRET_KEY: str = _DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = '["http://localhost:5173"]'

    ADMIN_EMAIL: str = "admin@gsi.local"
    ADMIN_PASSWORD: str = _DEFAULT_ADMIN_PASSWORD

    WP_ENCRYPTION_KEY: str = _DEFAULT_WP_ENCRYPTION_KEY

    UPLOAD_DIR: str = "uploads"
    UNSPLASH_ACCESS_KEY: str = ""

    # Base URL di Ollama per LLM second-opinion. Vuoto = disabilitato.
    # Es: "http://ollama:11434" in compose, o "http://localhost:11434" in dev locale.
    OLLAMA_BASE_URL: str = ""

    # Soglia minima di spazio libero (GB) sul disco UPLOAD_DIR per considerare
    # il servizio healthy (sotto: status=degraded).
    HEALTH_MIN_FREE_DISK_GB: float = 1.0

    # ------------------------------------------------------------------
    # Observability (Sprint 4 batch 3) — tutti opt-in
    # ------------------------------------------------------------------
    # Sentry DSN per tracking eccezioni in produzione. Vuoto = disabilitato.
    # Formato: https://<key>@o<org>.ingest.sentry.io/<project>
    SENTRY_DSN: str = ""
    # Environment tag inviato a Sentry (default = ENV). Utile per distinguere
    # staging da production nello stesso progetto Sentry.
    SENTRY_ENVIRONMENT: str = ""
    # Sampling rate dei trace (0.0-1.0). 0 = tracing disabilitato.
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0

    # Prometheus `/metrics` endpoint. True = esposto (default), False = disabled.
    # In produzione, proteggere l'endpoint via Traefik middleware se non si vuole
    # esporlo pubblicamente (vedi RUNBOOK).
    METRICS_ENABLED: bool = True

    # ------------------------------------------------------------------
    # Derived helpers
    # ------------------------------------------------------------------
    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    # ------------------------------------------------------------------
    # Production hardening — rifiuto dell'avvio con config insicura
    # ------------------------------------------------------------------
    @model_validator(mode="after")
    def _enforce_production_secrets(self) -> Settings:
        if self.ENV != "production":
            return self

        problems: list[str] = []

        if self.SECRET_KEY == _DEFAULT_SECRET_KEY:
            problems.append(
                "SECRET_KEY è al valore di default — rigenera con `secrets.token_urlsafe(64)`"
            )
        elif len(self.SECRET_KEY) < 32:
            problems.append("SECRET_KEY troppo corta (<32 caratteri)")

        if self.WP_ENCRYPTION_KEY == _DEFAULT_WP_ENCRYPTION_KEY:
            problems.append(
                "WP_ENCRYPTION_KEY è al valore di default — rigenera con `Fernet.generate_key()`"
            )

        if self.ADMIN_PASSWORD == _DEFAULT_ADMIN_PASSWORD:
            problems.append(
                "ADMIN_PASSWORD è al valore di default (`admin123`) — impostane una robusta"
            )

        for origin in self.cors_origins_list:
            if "localhost" in origin or "127.0.0.1" in origin:
                problems.append(f"CORS_ORIGINS contiene `{origin}` — non ammesso in produzione")
                break

        if problems:
            raise ValueError(
                "Configurazione insicura — il server non si avvierà:\n  - "
                + "\n  - ".join(problems)
            )

        return self

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
