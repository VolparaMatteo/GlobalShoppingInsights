from datetime import datetime

from pydantic import BaseModel


class SearchResultResponse(BaseModel):
    id: int
    url: str
    title: str | None = None
    snippet: str | None = None
    provider: str
    published_at_est: datetime | None = None
    domain: str | None = None
    language_est: str | None = None
    article_id: int | None = None
    # AI relevance score dell'Article collegato (null se la riga è stata filtrata
    # prima della creazione dell'articolo oppure se non c'è un article_id).
    article_score: int | None = None

    model_config = {"from_attributes": True}


class SearchRunResponse(BaseModel):
    id: int
    prompt_id: int
    triggered_by: int | None = None
    started_at: datetime
    ended_at: datetime | None = None
    status: str
    urls_found: int
    articles_created: int
    duplicates_skipped: int
    errors_count: int
    language_filtered: int = 0
    date_filtered: int = 0
    relevance_filtered: int = 0
    error_message: str | None = None
    results: list[SearchResultResponse] | None = None

    model_config = {"from_attributes": True}
