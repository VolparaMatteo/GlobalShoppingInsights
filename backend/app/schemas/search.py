from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class SearchResultResponse(BaseModel):
    id: int
    url: str
    title: Optional[str] = None
    snippet: Optional[str] = None
    provider: str
    published_at_est: Optional[datetime] = None
    domain: Optional[str] = None
    language_est: Optional[str] = None
    article_id: Optional[int] = None

    model_config = {"from_attributes": True}


class SearchRunResponse(BaseModel):
    id: int
    prompt_id: int
    triggered_by: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    urls_found: int
    articles_created: int
    duplicates_skipped: int
    errors_count: int
    error_message: Optional[str] = None
    results: Optional[List[SearchResultResponse]] = None

    model_config = {"from_attributes": True}
