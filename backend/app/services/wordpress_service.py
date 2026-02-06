import logging
from datetime import datetime, timezone
import httpx
from app.database import SessionLocal
from app.models.article import Article
from app.models.wordpress import WPConfig, WPPost
from app.models.logs import JobLog

logger = logging.getLogger(__name__)


def publish_to_wordpress(article_id: int):
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            logger.error(f"Article {article_id} not found")
            return

        config = db.query(WPConfig).filter(WPConfig.id == 1).first()
        if not config or not config.wp_url or not config.wp_username:
            article.status = "publish_failed"
            db.commit()
            logger.error("WordPress not configured")
            return

        job_log = JobLog(
            job_type="publish",
            entity_ref=f"article:{article_id}",
            status="running",
        )
        db.add(job_log)
        db.commit()

        try:
            wp_api_url = f"{config.wp_url.rstrip('/')}/wp-json/wp/v2/posts"
            post_data = {
                "title": article.title,
                "content": article.content_html or article.content_text or "",
                "status": "publish",
            }

            password = config.wp_app_password_encrypted or ""
            response = httpx.post(
                wp_api_url,
                json=post_data,
                auth=(config.wp_username, password),
                timeout=60,
            )
            response.raise_for_status()
            wp_data = response.json()

            wp_post = WPPost(
                article_id=article_id,
                wp_post_id=wp_data["id"],
                wp_url=wp_data.get("link"),
                wp_status=wp_data.get("status", "publish"),
                published_at=datetime.now(timezone.utc),
            )
            db.add(wp_post)
            article.status = "published"
            job_log.status = "completed"
            job_log.ended_at = datetime.now(timezone.utc)

        except Exception as e:
            logger.error(f"WordPress publish failed for article {article_id}: {e}")
            article.status = "publish_failed"
            job_log.status = "failed"
            job_log.error = str(e)
            job_log.ended_at = datetime.now(timezone.utc)

        db.commit()

    except Exception as e:
        logger.error(f"Publish service error: {e}")
    finally:
        db.close()
