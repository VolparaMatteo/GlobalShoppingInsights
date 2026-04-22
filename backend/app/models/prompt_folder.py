from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class PromptFolder(Base):
    __tablename__ = "prompt_folders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("prompt_folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
