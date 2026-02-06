from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    slug: Optional[str] = None


class TagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    wp_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: Optional[int] = None
    wp_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
