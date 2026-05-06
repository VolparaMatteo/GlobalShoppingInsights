from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, Field


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


# ---------------------------------------------------------------------------
# Auto-plan settimanale
# ---------------------------------------------------------------------------


class AutoPlanRequest(BaseModel):
    category: str = Field(..., description="Macrocategoria editoriale (es. STRATEGY)")
    week_start: date = Field(..., description="Lunedì della settimana target")
    publish_time: time = Field(
        default=time(9, 0), description="Orario di pubblicazione applicato a tutti gli slot"
    )
    target_min_per_day: int = Field(
        ..., gt=0, le=600, description="Minuti di lettura target/giorno"
    )
    strategy: Literal["cap", "spread"] = Field(
        default="spread",
        description="cap=non superare il target / spread=usa tutto il pool disponibile",
    )
    collision_strategy: Literal["fail", "integrate", "replace"] = Field(
        default="integrate",
        description=(
            "fail=errore se la settimana ha slot, integrate=riempi solo posti liberi, "
            "replace=cancella ed elimina gli slot esistenti"
        ),
    )
    timezone: str = Field(default="Europe/Rome")
    dry_run: bool = Field(
        default=True,
        description="True = solo preview, non scrive nulla. False = persiste gli slot.",
    )


class AutoPlanCandidateResponse(BaseModel):
    article_id: int
    title: str
    ai_score: int | None
    reading_time_min: int


class AutoPlanExistingSlotResponse(BaseModel):
    slot_id: int
    article_id: int | None
    article_title: str | None
    scheduled_for: datetime


class AutoPlanDayResponse(BaseModel):
    date: date
    scheduled_for: datetime
    articles: list[AutoPlanCandidateResponse]
    total_reading_min: int
    existing_slots: list[AutoPlanExistingSlotResponse]


class AutoPlanSummaryResponse(BaseModel):
    pool_size: int
    articles_planned: int
    articles_unscheduled: int
    total_reading_min: int
    avg_reading_min_per_day: float
    days_filled: int
    collision_detected: bool
    existing_slots_in_week: int
    warning: str | None
    error: str | None


class AutoPlanResponse(BaseModel):
    week_start: date
    week_end: date
    category: str
    target_min_per_day: int
    strategy: Literal["cap", "spread"]
    days: list[AutoPlanDayResponse]
    summary: AutoPlanSummaryResponse
    created_slot_ids: list[int]
