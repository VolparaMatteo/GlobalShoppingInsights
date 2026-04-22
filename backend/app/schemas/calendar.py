from datetime import datetime

from pydantic import BaseModel


class SlotCreate(BaseModel):
    article_id: int
    scheduled_for: datetime
    timezone: str = "Europe/Rome"


class SlotUpdate(BaseModel):
    scheduled_for: datetime | None = None
    timezone: str | None = None


class SlotResponse(BaseModel):
    id: int
    article_id: int | None = None
    scheduled_for: datetime
    timezone: str
    created_by: int | None = None
    status: str
    created_at: datetime | None = None
    article_title: str | None = None

    model_config = {"from_attributes": True}


class CollisionCheckRequest(BaseModel):
    scheduled_for: datetime
    exclude_slot_id: int | None = None


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
    value: int | None = None
    is_active: bool | None = None
