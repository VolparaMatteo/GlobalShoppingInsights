from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class PromptFolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None


class PromptFolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None


class PromptFolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    prompt_count: int = 0
    children: List["PromptFolderResponse"] = []
    created_at: datetime

    model_config = {"from_attributes": True}


PromptFolderResponse.model_rebuild()
