from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, func
from app.database import Base


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    folder_id = Column(Integer, ForeignKey("prompt_folders.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=False)
    excluded_keywords = Column(JSON, default=list)
    language = Column(String(10), nullable=True)
    countries = Column(JSON, default=list)
    time_depth = Column(String(10), default="7d")
    max_results = Column(Integer, default=20)
    schedule_enabled = Column(Boolean, default=False)
    schedule_frequency_hours = Column(Integer, nullable=True)
    schedule_specific_times = Column(JSON, nullable=True)
    schedule_next_run_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
