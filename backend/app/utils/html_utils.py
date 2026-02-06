import bleach

ALLOWED_TAGS = [
    "p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
    "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
]
ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
}


def sanitize_html(html: str) -> str:
    if not html:
        return ""
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
