import logging

import httpx
import py3langid as langid
import trafilatura
from htmldate import find_date

from app.utils.retry import with_retry

logger = logging.getLogger(__name__)


def detect_language(text: str) -> str | None:
    """Detect language using py3langid. Returns ISO 639-1 code or None."""
    if not text or len(text.strip()) < 50:
        return None
    try:
        lang, _confidence = langid.classify(text)
        return lang
    except Exception as e:
        logger.warning(f"Language detection failed: {e}")
        return None


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
}


@with_retry(max_attempts=3, initial_delay=1.0)
def _fetch_html(url: str, timeout: int) -> httpx.Response:
    """Download HTML con retry su timeout / connection / 5xx.

    Isolata qui così il retry copre SOLO la chiamata HTTP, non le fasi di
    scraping/parsing che seguono (ripeterle sarebbe costoso e inutile).
    """
    response = httpx.get(url, headers=DEFAULT_HEADERS, timeout=timeout, follow_redirects=True)
    response.raise_for_status()
    return response


def scrape_url(url: str, timeout: int = 30) -> dict | None:
    try:
        response = _fetch_html(url, timeout)
        html = response.text

        # Extract main text content
        text = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=True,
            include_links=True,
            output_format="txt",
        )

        if not text:
            return None

        # Extract metadata using bare_extraction (returns Document object in newer versions)
        extracted = trafilatura.bare_extraction(html, favor_recall=True)

        title = None
        author = None
        date = None
        image = None
        language = None

        if extracted is not None:
            # Handle both dict (old) and Document object (new) return types
            if isinstance(extracted, dict):
                title = extracted.get("title")
                author = extracted.get("author")
                date = extracted.get("date")
                image = extracted.get("image")
                language = extracted.get("language")
            else:
                title = getattr(extracted, "title", None)
                author = getattr(extracted, "author", None)
                date = getattr(extracted, "date", None)
                image = getattr(extracted, "image", None)
                language = getattr(extracted, "language", None)
        # Fallback: use htmldate if trafilatura didn't find a date
        if not date:
            date = find_date(html)

        # Fallback: detect language with py3langid if trafilatura didn't find it
        if not language:
            language = detect_language(text)

        return {
            "text": text,
            "html": html,
            "title": title,
            "author": author,
            "date": date,
            "image": image,
            "language": language,
        }

    except Exception as e:
        logger.error(f"Scraping failed for {url}: {e}")
        return None
