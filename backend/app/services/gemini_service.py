"""
Generazione titolo + estratto pubblicazione via Google Gemini.

Sostituisce — quando `GEMINI_API_KEY` è configurato — la chiamata Ollama
in `llm_service.generate_publication_text`. Vantaggi rispetto a Qwen 2.5 3B:
  - qualità italiana molto superiore (titoli giornalistici idiomatici)
  - latenza 3-8s vs 120-240s
  - JSON garantito via `response_mime_type='application/json'` + schema
  - VPS più leggero (no 4 GB di Ollama)

Rate limit free tier (`gemini-2.5-flash`): ~10 RPM, ~250 RPD.
Quando si esaurisce la quota arriva un 429: questo modulo solleva
`GeminiQuotaExceeded` così che l'orchestratore in `llm_service` possa
fare fallback su Ollama o restituire un errore esplicito all'utente.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.config import settings
from app.utils.circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Eccezioni dominio — l'orchestratore decide la policy (fallback / errore UI).
# ---------------------------------------------------------------------------
class GeminiError(RuntimeError):
    """Errore generico Gemini."""


class GeminiNotConfigured(GeminiError):
    """`GEMINI_API_KEY` non impostata."""


class GeminiQuotaExceeded(GeminiError):
    """Quota giornaliera o per-minuto esaurita (HTTP 429)."""


class GeminiUnavailable(GeminiError):
    """Errore di trasporto / server-side (5xx, timeout, network)."""


class GeminiInvalidResponse(GeminiError):
    """Il modello ha risposto con JSON inatteso o campi vuoti."""


# Reset breve (60s) perché 429 sul free tier è spesso solo per-minuto:
# se la quota giornaliera è andata, comunque l'orchestratore farà fallback.
_gemini_breaker = CircuitBreaker(name="gemini", failure_threshold=3, reset_timeout=60.0)


def get_gemini_breaker() -> CircuitBreaker:
    """Snapshot del circuit breaker — usato da /health e dai test."""
    return _gemini_breaker


def is_configured() -> bool:
    """True se la chiave API è valorizzata."""
    return bool(settings.GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# Prompt — replica fedelmente quello in llm_service per coerenza dell'output
# editoriale fra i due provider. Modificandolo lì, modificalo anche qui.
# ---------------------------------------------------------------------------
def _build_prompt(article_title: str, article_text: str) -> str:
    truncated = article_text[:4000]
    return f"""Sei un editor giornalistico italiano per un magazine di settore (retail, e-commerce, customer experience). Devi creare DA ZERO una versione editoriale italiana — titolo e riassunto — partendo dall'articolo qui sotto.

REGOLE CRITICHE PER IL TITOLO (LE PIÙ IMPORTANTI):
1. NON TRADURRE il titolo originale. Devi REINVENTARLO completamente in italiano.
2. La struttura, le parole e l'angolo del nuovo titolo devono essere DIVERSI dall'originale.
3. Punta a un titolo giornalistico italiano: può essere una domanda, un'affermazione provocatoria, un sottotitolo descrittivo, un "come/perché/cosa", un contrasto.
4. Massimo 90 caratteri. Italiano corretto, niente parole inventate o traduzioni dubbie.

ESEMPIO di traduzione (SBAGLIATO, NON FARE COSÌ):
- Originale: "Proactive vs Reactive Customer Service: When to Use Each"
- ❌ Sbagliato (è solo una traduzione): "Proattività vs Reattività: Quando Usare Ognuna"

ESEMPI di riformulazione (GIUSTI, fai così):
- ✅ "Servizio clienti: meglio anticipare i problemi o rispondere in tempo reale?"
- ✅ "Customer service tra prevenzione e reazione: come scegliere la strategia giusta"
- ✅ "Anticipare o reagire? Le due anime del customer service e quando usarle"

REGOLE PER L'ESTRATTO:
- Riassunto autonomo dell'articolo, in italiano, lunghezza tra 2000 e 2500 caratteri (incluse spaziature).
- Parafrasa con parole tue, NON copiare frasi dal testo originale.
- Tono giornalistico, scorrevole, professionale, informativo.
- Contestualizza il tema, espone i punti principali, sviluppa gli argomenti chiave e invoglia alla lettura.
- NIENTE link, CTA, firme, hashtag, emoji, claim non presenti nel testo.

ARTICOLO ORIGINALE:
- Titolo: {article_title}
- Testo: {truncated}

Rispondi con un oggetto JSON con i campi `title` (titolo italiano riformulato, MAI semplice traduzione) e `excerpt` (estratto italiano 2000-2500 caratteri)."""


# Schema responso — Gemini lo enforcing al model side: niente più parsing fragile.
_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "excerpt": {"type": "string"},
    },
    "required": ["title", "excerpt"],
}


def generate_publication_text(article_title: str, article_text: str) -> dict:
    """Genera titolo + estratto in italiano via Gemini.

    Returns:
        {"title": str, "excerpt": str}

    Raises:
        GeminiNotConfigured: se `GEMINI_API_KEY` è vuota.
        GeminiQuotaExceeded: 429 dal server (rate limit / quota esaurita).
        GeminiUnavailable:   5xx / timeout / connection error / circuit open.
        GeminiInvalidResponse: risposta non parsabile o campi vuoti.
    """
    if not is_configured():
        raise GeminiNotConfigured("GEMINI_API_KEY non impostata")

    if _gemini_breaker.is_open():
        # In OPEN, l'orchestratore deciderà il fallback. Non contiamo come
        # failure: la failure è già stata contata quando il breaker si è aperto.
        raise GeminiUnavailable("Gemini circuit breaker OPEN")

    # Import lazy: la libreria pesa ~30 MB e non vogliamo pagarla all'import
    # del modulo se Gemini non è configurato.
    try:
        from google import genai
        from google.genai import errors as genai_errors, types as genai_types
    except ImportError as e:
        raise GeminiNotConfigured(f"Pacchetto google-genai non disponibile: {e}") from e

    prompt = _build_prompt(article_title, article_text or "")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                # Coerente con il prompt Ollama: alta T per evitare la
                # traduzione letterale del titolo originale.
                temperature=0.85,
                # 2500 char IT ≈ 1100 token; abbondiamo per evitare troncamento.
                max_output_tokens=4096,
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
            ),
        )
    except genai_errors.ClientError as e:
        # 429 = quota / rate limit. Trattamento speciale: l'orchestratore può
        # decidere fallback Ollama. Apriamo il breaker comunque (60s) così
        # le chiamate concorrenti non si scontrano sulla stessa quota.
        status = getattr(e, "status_code", None) or getattr(e, "code", None)
        if status == 429:
            _gemini_breaker.record_failure()
            logger.warning("Gemini quota exceeded (429)")
            raise GeminiQuotaExceeded("Quota Gemini esaurita (429)") from e
        # Altri 4xx: API key invalida (401/403), bad request (400), ecc.
        # Non sono recoverable con un retry → apriamo subito il breaker.
        _gemini_breaker.record_failure()
        logger.warning("Gemini client error %s: %s", status, e)
        raise GeminiUnavailable(f"Errore client Gemini ({status}): {e}") from e
    except genai_errors.ServerError as e:
        _gemini_breaker.record_failure()
        logger.warning("Gemini server error: %s", e)
        raise GeminiUnavailable(f"Errore server Gemini: {e}") from e
    except genai_errors.APIError as e:
        # Catch-all per altri errori dell'SDK (es. rete, deadline).
        _gemini_breaker.record_failure()
        logger.warning("Gemini API error: %s", e)
        raise GeminiUnavailable(f"Errore Gemini: {e}") from e

    raw_text = (response.text or "").strip()
    if not raw_text:
        _gemini_breaker.record_failure()
        raise GeminiInvalidResponse("Gemini ha restituito una risposta vuota")

    try:
        data = json.loads(raw_text)
    except (json.JSONDecodeError, ValueError) as e:
        _gemini_breaker.record_failure()
        logger.warning("Gemini: parse JSON fallito. Raw prefix=%r", raw_text[:600])
        raise GeminiInvalidResponse("JSON non valido dal modello") from e

    title = (data.get("title") or "").strip()
    excerpt = (data.get("excerpt") or "").strip()
    if not title or not excerpt:
        _gemini_breaker.record_failure()
        logger.warning(
            "Gemini: campi vuoti. title_len=%d excerpt_len=%d",
            len(title),
            len(excerpt),
        )
        raise GeminiInvalidResponse("Titolo o estratto vuoto")

    # Hard cap di sicurezza per titoli abnormi (mirror del check Ollama).
    if len(title) > 200:
        title = title[:200].rstrip() + "…"

    _gemini_breaker.record_success()
    return {"title": title, "excerpt": excerpt}
