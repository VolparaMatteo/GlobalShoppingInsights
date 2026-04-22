from datetime import datetime

from pydantic import BaseModel


class PromptCreate(BaseModel):
    title: str
    description: str | None = None
    keywords: list[str] = []
    excluded_keywords: list[str] = []
    language: str | None = None
    countries: list[str] = []
    time_depth: str = "7d"
    max_results: int = 20
    schedule_enabled: bool = False
    schedule_frequency_hours: int | None = None
    schedule_specific_times: list[str] | None = None
    folder_id: int | None = None


class PromptUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    keywords: list[str] | None = None
    excluded_keywords: list[str] | None = None
    language: str | None = None
    countries: list[str] | None = None
    time_depth: str | None = None
    max_results: int | None = None
    schedule_enabled: bool | None = None
    schedule_frequency_hours: int | None = None
    schedule_specific_times: list[str] | None = None
    is_active: bool | None = None
    folder_id: int | None = None


class PromptResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    keywords: list[str]
    excluded_keywords: list[str]
    language: str | None = None
    countries: list[str]
    time_depth: str
    max_results: int
    schedule_enabled: bool
    schedule_frequency_hours: int | None = None
    schedule_specific_times: list[str] | None = None
    schedule_next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    is_active: bool
    folder_id: int | None = None
    folder_name: str | None = None
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
