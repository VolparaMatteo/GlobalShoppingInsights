from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.database import Base


class SearchRun(Base):
    __tablename__ = "search_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, nullable=False, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(30), nullable=False, default="pending")
    urls_found = Column(Integer, default=0)
    articles_created = Column(Integer, default=0)
    duplicates_skipped = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    language_filtered = Column(Integer, default=0)
    date_filtered = Column(Integer, default=0)
    relevance_filtered = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)


class SearchResult(Base):
    __tablename__ = "search_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    search_run_id = Column(Integer, ForeignKey("search_runs.id"), nullable=False)
    url = Column(Text, nullable=False, index=True)
    title = Column(String(500), nullable=True)
    snippet = Column(Text, nullable=True)
    provider = Column(String(20), nullable=False)
    published_at_est = Column(DateTime, nullable=True)
    domain = Column(String(255), nullable=True)
    language_est = Column(String(10), nullable=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=True)
