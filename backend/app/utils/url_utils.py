from urllib.parse import urlparse


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    scheme = parsed.scheme or "https"
    netloc = parsed.netloc.lower().removeprefix("www.")
    path = parsed.path.rstrip("/") or "/"
    return f"{scheme}://{netloc}{path}"


def extract_domain(url: str) -> str:
    parsed = urlparse(url)
    domain = parsed.netloc.lower().removeprefix("www.")
    return domain
