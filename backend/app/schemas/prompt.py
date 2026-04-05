from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PromptCreate(BaseModel):
    title: str
    description: Optional[str] = None
    keywords: List[str] = []
    excluded_keywords: List[str] = []
    language: Optional[str] = None
    countries: List[str] = []
    time_depth: str = "7d"
    max_results: int = 20
    schedule_enabled: bool = False
    schedule_frequency_hours: Optional[int] = None
    schedule_specific_times: Optional[List[str]] = None
    folder_id: Optional[int] = None


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    excluded_keywords: Optional[List[str]] = None
    language: Optional[str] = None
    countries: Optional[List[str]] = None
    time_depth: Optional[str] = None
    max_results: Optional[int] = None
    schedule_enabled: Optional[bool] = None
    schedule_frequency_hours: Optional[int] = None
    schedule_specific_times: Optional[List[str]] = None
    is_active: Optional[bool] = None
    folder_id: Optional[int] = None


class PromptResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    keywords: List[str]
    excluded_keywords: List[str]
    language: Optional[str] = None
    countries: List[str]
    time_depth: str
    max_results: int
    schedule_enabled: bool
    schedule_frequency_hours: Optional[int] = None
    schedule_specific_times: Optional[List[str]] = None
    schedule_next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    is_active: bool
    folder_id: Optional[int] = None
    folder_name: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
