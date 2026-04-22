from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ArticleUpdate(BaseModel):
    title: str | None = None
    content_html: str | None = None
    content_text: str | None = None
    author: str | None = None
    language: str | None = None
    country: str | None = None
    featured_image_url: str | None = None


class StatusChangeRequest(BaseModel):
    new_status: str
    comment: str | None = None


class BatchActionRequest(BaseModel):
    article_ids: list[int]
    action: str  # tag, status, discard
    tag_ids: list[int] | None = None
    category_ids: list[int] | None = None
    new_status: str | None = None


class PromptSummary(BaseModel):
    id: int
    title: str
    keywords: list[str] = []

    model_config = {"from_attributes": True}


class ArticleResponse(BaseModel):
    id: int
    canonical_url: str
    source_domain: str
    title: str
    author: str | None = None
    published_at: datetime | None = None
    language: str
    country: str | None = None
    content_html: str | None = None
    content_text: str | None = None
    status: str
    featured_image_url: str | None = None
    images: list[str] = []
    is_paywalled: bool
    ai_score: int | None = None
    ai_score_explanation: list[str] | None = None
    ai_suggested_tags: list[str] | None = None
    ai_suggested_category: str | None = None
    ai_relevance_comment: str | None = None
    duplicate_of_id: int | None = None
    created_at: datetime
    updated_at: datetime
    tags: list[Any] = []
    categories: list[Any] = []
    prompts: list[PromptSummary] = []

    model_config = {"from_attributes": True}


class RevisionResponse(BaseModel):
    id: int
    article_id: int
    version: int
    editor_id: int
    changes: list[dict]
    created_at: datetime

    model_config = {"from_attributes": True}
