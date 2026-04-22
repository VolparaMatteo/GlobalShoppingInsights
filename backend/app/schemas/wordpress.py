from datetime import datetime

from pydantic import BaseModel


class WPConfigUpdate(BaseModel):
    wp_url: str | None = None
    wp_username: str | None = None
    wp_app_password: str | None = None
    default_author_id: int | None = None


class WPConfigResponse(BaseModel):
    wp_url: str | None = None
    wp_username: str | None = None
    has_password: bool = False
    default_author_id: int | None = None
    last_sync_at: datetime | None = None


class WPPostResponse(BaseModel):
    id: int
    article_id: int
    wp_post_id: int
    wp_url: str | None = None
    wp_status: str | None = None
    published_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
