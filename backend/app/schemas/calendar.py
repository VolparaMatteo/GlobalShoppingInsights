from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SlotCreate(BaseModel):
    article_id: int
    scheduled_for: datetime
    timezone: str = "Europe/Rome"


class SlotUpdate(BaseModel):
    scheduled_for: Optional[datetime] = None
    timezone: Optional[str] = None


class SlotResponse(BaseModel):
    id: int
    article_id: Optional[int] = None
    scheduled_for: datetime
    timezone: str
    created_by: Optional[int] = None
    status: str
    created_at: Optional[datetime] = None
    article_title: Optional[str] = None

    model_config = {"from_attributes": True}


class CollisionCheckRequest(BaseModel):
    scheduled_for: datetime
    exclude_slot_id: Optional[int] = None


class CollisionCheckResponse(BaseModel):
    has_collision: bool
    existing_slots: list


class CalendarRuleResponse(BaseModel):
    id: int
    rule_type: str
    value: int
    is_active: bool

    model_config = {"from_attributes": True}


class CalendarRuleUpdate(BaseModel):
    value: Optional[int] = None
    is_active: Optional[bool] = None
