from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class WPConfigUpdate(BaseModel):
    wp_url: Optional[str] = None
    wp_username: Optional[str] = None
    wp_app_password: Optional[str] = None
    default_author_id: Optional[int] = None


class WPConfigResponse(BaseModel):
    wp_url: Optional[str] = None
    wp_username: Optional[str] = None
    has_password: bool = False
    default_author_id: Optional[int] = None
    last_sync_at: Optional[datetime] = None


class WPPostResponse(BaseModel):
    id: int
    article_id: int
    wp_post_id: int
    wp_url: Optional[str] = None
    wp_status: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
