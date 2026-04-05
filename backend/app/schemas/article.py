from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content_html: Optional[str] = None
    content_text: Optional[str] = None
    author: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None
    featured_image_url: Optional[str] = None


class StatusChangeRequest(BaseModel):
    new_status: str
    comment: Optional[str] = None


class BatchActionRequest(BaseModel):
    article_ids: List[int]
    action: str  # tag, status, discard
    tag_ids: Optional[List[int]] = None
    category_ids: Optional[List[int]] = None
    new_status: Optional[str] = None


class PromptSummary(BaseModel):
    id: int
    title: str
    keywords: List[str] = []

    model_config = {"from_attributes": True}


class ArticleResponse(BaseModel):
    id: int
    canonical_url: str
    source_domain: str
    title: str
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    language: str
    country: Optional[str] = None
    content_html: Optional[str] = None
    content_text: Optional[str] = None
    status: str
    featured_image_url: Optional[str] = None
    images: List[str] = []
    is_paywalled: bool
    ai_score: Optional[int] = None
    ai_score_explanation: Optional[List[str]] = None
    ai_suggested_tags: Optional[List[str]] = None
    ai_suggested_category: Optional[str] = None
    ai_relevance_comment: Optional[str] = None
    duplicate_of_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    tags: List[Any] = []
    categories: List[Any] = []
    prompts: List[PromptSummary] = []

    model_config = {"from_attributes": True}


class RevisionResponse(BaseModel):
    id: int
    article_id: int
    version: int
    editor_id: int
    changes: List[dict]
    created_at: datetime

    model_config = {"from_attributes": True}
