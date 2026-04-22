from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    func,
)

from app.database import Base

article_prompts = Table(
    "article_prompts",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.id"), primary_key=True),
    Column("prompt_id", Integer, ForeignKey("prompts.id"), primary_key=True),
)

article_tags = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

article_categories = Table(
    "article_categories",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    canonical_url = Column(Text, unique=True, nullable=False, index=True)
    source_domain = Column(String(255), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    author = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True, index=True)
    language = Column(String(10), nullable=False, index=True)
    country = Column(String(10), nullable=True)
    content_html = Column(Text, nullable=True)
    content_text = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="imported", index=True)
    featured_image_url = Column(Text, nullable=True)
    images = Column(JSON, default=list)
    is_paywalled = Column(Boolean, default=False)
    ai_score = Column(Integer, nullable=True)
    ai_score_explanation = Column(JSON, nullable=True)
    ai_suggested_tags = Column(JSON, nullable=True)
    ai_suggested_category = Column(String(100), nullable=True)
    ai_model_version = Column(String(50), nullable=True)
    ai_relevance_comment = Column(Text, nullable=True)
    duplicate_of_id = Column(Integer, ForeignKey("articles.id"), nullable=True)
    raw_html = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class ArticleRevision(Base):
    __tablename__ = "article_revisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    version = Column(Integer, nullable=False)
    editor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    changes = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
