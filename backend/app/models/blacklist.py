from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.database import Base


class BlockedDomain(Base):
    __tablename__ = "blocked_domains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain = Column(String(255), unique=True, nullable=False)
    reason = Column(Text, nullable=True)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
