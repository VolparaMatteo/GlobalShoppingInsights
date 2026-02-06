from sqlalchemy import Column, Integer, Text, DateTime, JSON, ForeignKey, func
from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    mentions = Column(JSON, default=list)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
