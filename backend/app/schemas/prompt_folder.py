from datetime import datetime

from pydantic import BaseModel


class PromptFolderCreate(BaseModel):
    name: str
    parent_id: int | None = None


class PromptFolderUpdate(BaseModel):
    name: str | None = None
    parent_id: int | None = None


class PromptFolderResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None = None
    prompt_count: int = 0
    children: list["PromptFolderResponse"] = []
    created_at: datetime

    model_config = {"from_attributes": True}


PromptFolderResponse.model_rebuild()
