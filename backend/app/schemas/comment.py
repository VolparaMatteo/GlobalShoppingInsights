from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    body: str
    mentions: list[int] = []


class CommentResponse(BaseModel):
    id: int
    article_id: int
    user_id: int
    body: str
    mentions: list[int]
    created_at: datetime
    user_name: str | None = None

    model_config = {"from_attributes": True}
