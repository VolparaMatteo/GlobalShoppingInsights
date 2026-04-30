"""
LLM-based relevance evaluation using Ollama (local).

Calls a lightweight model (Qwen 2.5 3B) to read the article and decide
whether it is genuinely relevant to the search prompt, producing a
human-readable comment in the article's language.
"""

import json
import logging

import httpx

from app.config import settings
from app.utils.circuit_breaker import CircuitBreaker
from app.utils.retry import with_retry

logger = logging.getLogger(__name__)

# Base URL letta dalle settings (es. http://ollama:11434 in compose).
# Vuoto = LLM disabilitato; la funzione evaluate_relevance restituisce il fallback.
OLLAMA_MODEL = "qwen2.5:3b"
OLLAMA_TIMEOUT = 60  # seconds

# Circuit breaker module-level: dopo 3 failure consecutive chiude il circuito
# per 5 minuti, durante i quali evaluate_relevance ritorna il fallback senza
# nemmeno provare a contattare Ollama. Lo stato e' esposto via /health perche'
# il frontend possa mostrare un banner "LLM offline".
_ollama_breaker = CircuitBreaker(name="ollama", failure_threshold=3, reset_timeout=300.0)


def get_ollama_breaker() -> CircuitBreaker:
    """Access al circuit breaker (per /health endpoint e test)."""
    return _ollama_breaker


def _ollama_base_url() -> str:
    return (settings.OLLAMA_BASE_URL or "").rstrip("/")


def _build_prompt(
    article_title: str,
    article_text: str,
    prompt_description: str,
    prompt_keywords: list[str],
    language: str,
) -> str:
    """Build the system+user prompt sent to the LLM."""

    # Comment is always in Italian (UI language) regardless of article language
    lang_label = "italiano"

    # Truncate article to ~3000 chars to stay within context limits
    truncated = article_text[:3000]

    keywords_str = ", ".join(prompt_keywords) if prompt_keywords else "(none)"

    return f"""You are a relevance evaluator. Your job is to decide whether a news article is genuinely about the topic described below, and to score its relevance.

SEARCH TOPIC:
- Description: {prompt_description}
- Keywords: {keywords_str}

ARTICLE:
- Title: {article_title}
- Text: {truncated}

INSTRUCTIONS:
1. Read the article carefully.
2. Decide if the article is genuinely and substantially about the search topic.
3. An article that merely mentions a keyword in passing but is actually about a different subject is NOT relevant.
4. Assign a relevance score from 0 to 100. Use the FULL RANGE and avoid round/canonical numbers
   (do NOT pick 80, 85, 90, 95, 100 unless the article is exactly that level — vary by ±2-4 points
   based on quality, depth, recency, source authority).
   Reference bands (pick a SPECIFIC value INSIDE these, not the boundary):
   - 88-100: Exceptional, comprehensive coverage of the exact topic (e.g. 91, 94, 97)
   - 72-87: Strong on-topic article, deep treatment (e.g. 74, 79, 83, 86)
   - 55-71: Substantially relevant, shares attention with adjacent themes (e.g. 57, 62, 68)
   - 35-54: Tangential — topic is mentioned but not the focus (e.g. 38, 44, 51)
   - 0-34: Off-topic or only loosely connected (e.g. 12, 22, 31)
5. Respond ONLY with a valid JSON object (no markdown, no extra text):

{{"relevant": true/false, "score": <integer 0-100>, "comment": "your explanation in {lang_label}", "confidence": 0.0-1.0}}

The "comment" field must be written in {lang_label}. Keep it concise (1-2 sentences)."""


def evaluate_relevance(
    article_text: str,
    article_title: str,
    prompt_description: str,
    prompt_keywords: list[str],
    language: str = "en",
) -> dict:
    """
    Call Ollama to evaluate whether the article is relevant to the prompt.

    Returns:
        {
            "relevant": bool,
            "comment": str | None,
            "confidence": float,
        }

    On failure (Ollama down, timeout, parse error) returns a permissive
    fallback so the pipeline is not blocked.
    """
    fallback = {"relevant": True, "comment": None, "confidence": 0.0, "score": None}

    base_url = _ollama_base_url()
    if not base_url:
        # LLM non configurato: pipeline prosegue con i soli embeddings.
        return fallback

    # Circuit breaker: se OPEN saltiamo subito senza chiamare Ollama.
    if _ollama_breaker.is_open():
        logger.info("Ollama circuit breaker OPEN — skipping LLM relevance check")
        return fallback

    prompt = _build_prompt(
        article_title, article_text, prompt_description, prompt_keywords, language
    )

    try:
        raw_text = _call_ollama_generate(base_url, prompt)
    except httpx.ConnectError:
        logger.warning("Ollama non raggiungibile — skipping LLM relevance check")
        _ollama_breaker.record_failure()
        return fallback
    except httpx.TimeoutException:
        logger.warning("Ollama timeout — skipping LLM relevance check")
        _ollama_breaker.record_failure()
        return fallback
    except httpx.HTTPStatusError as e:
        logger.warning(f"Ollama HTTP {e.response.status_code} — skipping")
        _ollama_breaker.record_failure()
        return fallback

    _ollama_breaker.record_success()
    return _parse_llm_response(raw_text, fallback)


@with_retry(max_attempts=2, initial_delay=1.0)
def _call_ollama_generate(base_url: str, prompt: str) -> str:
    """Chiamata a /api/generate con retry (2 tentativi — LLM è lento di suo).

    Ritorna il testo grezzo di `response`. Può sollevare httpx.* su errore
    persistente (gestito dal chiamante con fallback permissivo).
    """
    response = httpx.post(
        f"{base_url}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                # 0.4 invece di 0.1: 3B model con T=0.1 collassava su valori
                # canonici (85/39/0). T più alta dà variabilità realistica;
                # il prompt rinforzato evita comunque hallucination su altri campi.
                "temperature": 0.4,
                "num_predict": 256,
            },
        },
        timeout=OLLAMA_TIMEOUT,
    )
    response.raise_for_status()
    return str(response.json().get("response", "")).strip()


def _parse_llm_response(raw_text: str, fallback: dict) -> dict:
    """Extract the JSON object from the LLM's response."""
    # Try direct parse first
    try:
        data = json.loads(raw_text)
        return _validate(data)
    except (json.JSONDecodeError, ValueError):
        pass

    # Sometimes the model wraps JSON in markdown code fences
    for marker in ("```json", "```"):
        if marker in raw_text:
            start = raw_text.index(marker) + len(marker)
            end = raw_text.index("```", start) if "```" in raw_text[start:] else len(raw_text)
            try:
                data = json.loads(raw_text[start:end].strip())
                return _validate(data)
            except (json.JSONDecodeError, ValueError):
                pass

    logger.warning(f"Could not parse LLM response: {raw_text[:200]}")
    return fallback


def _validate(data: dict) -> dict:
    """Ensure the parsed dict has the expected shape."""
    raw_score = data.get("score")
    score = min(100, max(0, int(raw_score))) if raw_score is not None else None
    return {
        "relevant": bool(data.get("relevant", True)),
        "score": score,
        "comment": data.get("comment") or None,
        "confidence": float(data.get("confidence", 0.0)),
    }


# ---------------------------------------------------------------------------
# Generazione titolo + estratto per pubblicazione (no copyright)
# ---------------------------------------------------------------------------


def _build_publication_prompt(article_title: str, article_text: str) -> str:
    """Prompt che chiede al modello di riformulare titolo + estratto.

    Output forzato in italiano e in JSON. Il prompt insiste sul fatto che il
    risultato deve essere una riformulazione genuina (non copia letterale né
    traduzione letterale) perché pubblichiamo su WordPress senza diritti sul
    testo originale.
    """
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
- Riassunto autonomo dell'articolo, in italiano, 180-230 parole.
- Parafrasa con parole tue, NON copiare frasi dal testo originale.
- Tono giornalistico, scorrevole, professionale, informativo.
- Contestualizza il tema, espone i punti principali e invoglia alla lettura.
- NIENTE link, CTA, firme, hashtag, emoji, claim non presenti nel testo.

ARTICOLO ORIGINALE:
- Titolo: {article_title}
- Testo: {truncated}

Rispondi SOLO con un oggetto JSON valido (no markdown, no testo extra), entrambi i campi in italiano:
{{"title": "<titolo italiano riformulato, MAI una semplice traduzione>", "excerpt": "<estratto italiano 180-230 parole>"}}"""


def generate_publication_text(article_title: str, article_text: str) -> dict:
    """Chiama Ollama per generare titolo + estratto pronti alla pubblicazione.

    Returns:
        {"title": str, "excerpt": str}

    Solleva RuntimeError se Ollama non è configurato, è in circuit-open,
    oppure la risposta non è parsabile — in modo che l'endpoint API possa
    restituire un 503 leggibile lato UI invece di salvare contenuto vuoto.
    """
    base_url = _ollama_base_url()
    if not base_url:
        raise RuntimeError("LLM non configurato sul server")
    if _ollama_breaker.is_open():
        raise RuntimeError("LLM temporaneamente non disponibile (circuit breaker aperto)")

    prompt = _build_publication_prompt(article_title, article_text or "")

    try:
        response = httpx.post(
            f"{base_url}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    # Temperature alta per evitare che il modello scivoli
                    # nella traduzione letterale del titolo originale.
                    "temperature": 0.85,
                    "num_predict": 1100,
                },
            },
            timeout=180,
        )
        response.raise_for_status()
        raw_text = str(response.json().get("response", "")).strip()
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError) as e:
        _ollama_breaker.record_failure()
        logger.warning(f"Ollama generate publication failed: {e}")
        raise RuntimeError(f"Errore nella chiamata al modello: {e}") from e

    _ollama_breaker.record_success()

    parsed = _try_parse_json(raw_text)
    if not parsed or not isinstance(parsed, dict):
        raise RuntimeError("Il modello non ha restituito JSON valido")

    title = (parsed.get("title") or "").strip()
    excerpt = (parsed.get("excerpt") or "").strip()
    if not title or not excerpt:
        raise RuntimeError("Il modello ha restituito titolo o estratto vuoto")

    # Hard cap di sicurezza per evitare titoli abnormi
    if len(title) > 200:
        title = title[:200].rstrip() + "…"

    return {"title": title, "excerpt": excerpt}


def _try_parse_json(raw_text: str) -> dict | None:
    """Estrae un oggetto JSON da una risposta LLM, gestendo code-fence."""
    try:
        return json.loads(raw_text)
    except (json.JSONDecodeError, ValueError):
        pass
    for marker in ("```json", "```"):
        if marker in raw_text:
            start = raw_text.index(marker) + len(marker)
            tail = raw_text[start:]
            end = tail.index("```") if "```" in tail else len(tail)
            try:
                return json.loads(tail[:end].strip())
            except (json.JSONDecodeError, ValueError):
                continue
    # Fallback: cerca la prima { e l'ultima } e prova a parsare
    if "{" in raw_text and "}" in raw_text:
        snippet = raw_text[raw_text.index("{") : raw_text.rindex("}") + 1]
        try:
            return json.loads(snippet)
        except (json.JSONDecodeError, ValueError):
            return None
    return None
