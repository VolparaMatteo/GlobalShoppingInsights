"""
LLM-based relevance evaluation using Ollama (local).

Calls a lightweight model (Qwen 2.5 3B) to read the article and decide
whether it is genuinely relevant to the search prompt, producing a
human-readable comment in the article's language.
"""

import json
import logging
from typing import Optional

import httpx

from app.config import settings
from app.utils.retry import with_retry

logger = logging.getLogger(__name__)

# Base URL letta dalle settings (es. http://ollama:11434 in compose).
# Vuoto = LLM disabilitato; la funzione evaluate_relevance restituisce il fallback.
OLLAMA_MODEL = "qwen2.5:3b"
OLLAMA_TIMEOUT = 60  # seconds


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
4. Assign a relevance score from 0 to 100:
   - 80-100: The article is directly and deeply about the search topic
   - 60-79: The article is substantially about the topic but also covers other themes
   - 40-59: The article touches on the topic but it is not the main focus
   - 0-39: The article is not about the topic
5. Respond ONLY with a valid JSON object (no markdown, no extra text):

{{"relevant": true/false, "score": 0-100, "comment": "your explanation in {lang_label}", "confidence": 0.0-1.0}}

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

    prompt = _build_prompt(
        article_title, article_text, prompt_description, prompt_keywords, language
    )

    try:
        raw_text = _call_ollama_generate(base_url, prompt)
    except httpx.ConnectError:
        logger.warning("Ollama non raggiungibile — skipping LLM relevance check")
        return fallback
    except httpx.TimeoutException:
        logger.warning("Ollama timeout — skipping LLM relevance check")
        return fallback
    except httpx.HTTPStatusError as e:
        logger.warning(f"Ollama HTTP {e.response.status_code} — skipping")
        return fallback

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
                "temperature": 0.1,
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
