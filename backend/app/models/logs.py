from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text, func

from app.database import Base


class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_type = Column(String(50), nullable=False)
    entity_ref = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False)
    started_at = Column(DateTime, nullable=False, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)
    progress = Column(Integer, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    entity = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    metadata_ = Column("metadata", JSON, nullable=True)
