from datetime import datetime

from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    slug: str | None = None


class TagUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    wp_id: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    slug: str | None = None
    parent_id: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    parent_id: int | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: int | None = None
    wp_id: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
