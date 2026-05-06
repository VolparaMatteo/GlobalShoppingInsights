"""Test per gemini_service e l'orchestratore generate_publication_text.

Strategia: non chiamiamo l'SDK reale di Google. Mockiamo
`gemini_service.generate_publication_text` per validare l'orchestrazione
in `llm_service`, e testiamo separatamente i contratti pubblici di
gemini_service (is_configured, circuit breaker snapshot).
"""

from __future__ import annotations

import pytest

from app.services import gemini_service, llm_service

# ---------------------------------------------------------------------------
# gemini_service — superficie pubblica
# ---------------------------------------------------------------------------


def test_is_configured_false_when_key_empty(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "")
    assert gemini_service.is_configured() is False


def test_is_configured_true_when_key_set(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "fake-key")
    assert gemini_service.is_configured() is True


def test_breaker_starts_closed():
    breaker = gemini_service.get_gemini_breaker()
    snap = breaker.snapshot()
    assert snap["name"] == "gemini"
    assert snap["state"] in ("closed", "half_open", "open")  # accettiamo qualsiasi
    # Reset per i test successivi
    breaker.record_success()


def test_raises_not_configured_when_key_missing(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "")
    with pytest.raises(gemini_service.GeminiNotConfigured):
        gemini_service.generate_publication_text("Title", "Body")


def test_raises_unavailable_when_breaker_open(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "fake-key")
    breaker = gemini_service.get_gemini_breaker()
    # Forza OPEN
    for _ in range(breaker.failure_threshold):
        breaker.record_failure()
    try:
        with pytest.raises(gemini_service.GeminiUnavailable):
            gemini_service.generate_publication_text("Title", "Body")
    finally:
        breaker.record_success()  # reset


# ---------------------------------------------------------------------------
# Orchestratore — fallback policy
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _reset_breakers():
    """Garantisce CLOSED prima/dopo ogni test orchestratore."""
    gemini_service.get_gemini_breaker().record_success()
    llm_service.get_ollama_breaker().record_success()
    yield
    gemini_service.get_gemini_breaker().record_success()
    llm_service.get_ollama_breaker().record_success()


def test_orchestrator_uses_gemini_when_configured(monkeypatch):
    """Gemini configurato + risposta valida → niente fallback su Ollama."""
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "fake-key")
    expected = {"title": "Titolo IT", "excerpt": "Estratto IT" * 200}
    monkeypatch.setattr(gemini_service, "generate_publication_text", lambda *_a, **_k: expected)

    # Verifichiamo che Ollama NON venga toccato.
    def _ollama_must_not_be_called(*_a, **_k):
        raise AssertionError("Ollama non deve essere chiamato quando Gemini risponde")

    monkeypatch.setattr(
        llm_service, "_generate_publication_text_ollama", _ollama_must_not_be_called
    )

    result = llm_service.generate_publication_text("Title", "Body")
    assert result == expected


def test_orchestrator_falls_back_to_ollama_on_quota(monkeypatch):
    """Gemini → 429 quota → fallback automatico su Ollama."""
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "fake-key")

    def _gemini_quota(*_a, **_k):
        raise gemini_service.GeminiQuotaExceeded("Quota Gemini esaurita (429)")

    monkeypatch.setattr(gemini_service, "generate_publication_text", _gemini_quota)

    fallback_payload = {"title": "Titolo da Ollama", "excerpt": "x" * 2100}
    monkeypatch.setattr(
        llm_service, "_generate_publication_text_ollama", lambda *_a, **_k: fallback_payload
    )

    assert llm_service.generate_publication_text("T", "B") == fallback_payload


def test_orchestrator_propagates_gemini_error_when_ollama_missing(monkeypatch):
    """Solo Gemini configurato + errore Gemini + Ollama assente → RuntimeError
    con il messaggio Gemini (più informativo del default)."""
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "fake-key")
    monkeypatch.setattr(llm_service.settings, "OLLAMA_BASE_URL", "")

    def _gemini_quota(*_a, **_k):
        raise gemini_service.GeminiQuotaExceeded("Quota Gemini esaurita (429)")

    monkeypatch.setattr(gemini_service, "generate_publication_text", _gemini_quota)

    with pytest.raises(RuntimeError, match="Quota Gemini"):
        llm_service.generate_publication_text("T", "B")


def test_orchestrator_uses_ollama_when_gemini_not_configured(monkeypatch):
    """Solo Ollama → si va dritti su Ollama senza nemmeno passare per Gemini."""
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "")

    def _gemini_must_not_be_called(*_a, **_k):
        raise AssertionError("Gemini non deve essere chiamato")

    monkeypatch.setattr(gemini_service, "generate_publication_text", _gemini_must_not_be_called)

    expected = {"title": "Da Ollama", "excerpt": "y" * 2100}
    monkeypatch.setattr(
        llm_service, "_generate_publication_text_ollama", lambda *_a, **_k: expected
    )

    assert llm_service.generate_publication_text("T", "B") == expected


def test_orchestrator_no_provider_configured(monkeypatch):
    """Né Gemini né Ollama → errore esplicito."""
    monkeypatch.setattr(gemini_service.settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(llm_service.settings, "OLLAMA_BASE_URL", "")

    with pytest.raises(RuntimeError, match="LLM non configurato"):
        llm_service.generate_publication_text("T", "B")


# ---------------------------------------------------------------------------
# /health — gemini è "skipped" di default in test
# ---------------------------------------------------------------------------


def test_health_includes_gemini_skipped_by_default(client):
    r = client.get("/api/v1/health")
    data = r.json()
    assert "gemini" in data["checks"]
    assert data["checks"]["gemini"]["status"] == "skipped"
    assert "gemini_circuit" in data["checks"]
    assert data["checks"]["gemini_circuit"]["name"] == "gemini"


def test_health_gemini_ok_when_configured(client, monkeypatch):
    from app.api import health as health_module

    monkeypatch.setattr(health_module.settings, "GEMINI_API_KEY", "fake-key")
    monkeypatch.setattr(health_module.settings, "GEMINI_MODEL", "gemini-2.5-flash")
    r = client.get("/api/v1/health")
    data = r.json()
    assert data["checks"]["gemini"]["status"] == "ok"
    assert data["checks"]["gemini"]["model"] == "gemini-2.5-flash"
