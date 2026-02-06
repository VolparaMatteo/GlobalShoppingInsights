from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CommentCreate(BaseModel):
    body: str
    mentions: List[int] = []


class CommentResponse(BaseModel):
    id: int
    article_id: int
    user_id: int
    body: str
    mentions: List[int]
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}
