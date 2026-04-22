from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class EditorialSlot(Base):
    __tablename__ = "editorial_slots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), unique=True, nullable=True)
    scheduled_for = Column(DateTime, nullable=False, index=True)
    timezone = Column(String(50), default="Europe/Rome")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="scheduled")
    created_at = Column(DateTime, server_default=func.now())


class CalendarRule(Base):
    __tablename__ = "calendar_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_type = Column(String(50), nullable=False)
    value = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
