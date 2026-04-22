from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.database import Base


class WPPost(Base):
    __tablename__ = "wp_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), unique=True, nullable=False)
    wp_post_id = Column(Integer, nullable=False)
    wp_url = Column(Text, nullable=True)
    wp_status = Column(String(20), nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class WPConfig(Base):
    __tablename__ = "wp_config"

    id = Column(Integer, primary_key=True, default=1)
    wp_url = Column(Text, nullable=True)
    wp_username = Column(String(255), nullable=True)
    wp_app_password_encrypted = Column(Text, nullable=True)
    default_author_id = Column(Integer, nullable=True)
    last_sync_at = Column(DateTime, nullable=True)
