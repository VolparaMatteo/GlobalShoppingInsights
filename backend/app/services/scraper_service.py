import logging
from typing import Optional
import httpx
import trafilatura

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
}


def scrape_url(url: str, timeout: int = 30) -> Optional[dict]:
    try:
        response = httpx.get(url, headers=DEFAULT_HEADERS, timeout=timeout, follow_redirects=True)
        response.raise_for_status()
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
        extracted = trafilatura.bare_extraction(html)

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
