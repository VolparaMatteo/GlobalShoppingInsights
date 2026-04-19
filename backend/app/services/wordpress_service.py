import logging
import os
from datetime import datetime, timezone
import httpx
from app.config import settings
from app.database import SessionLocal
from app.models.article import Article, article_tags, article_categories
from app.models.taxonomy import Tag, Category
from app.models.calendar import EditorialSlot
from app.models.wordpress import WPConfig, WPPost
from app.models.logs import JobLog
from app.utils.encryption import decrypt, is_encrypted

logger = logging.getLogger(__name__)


def _wp_auth_credentials(config: WPConfig) -> tuple[str, str]:
    """Restituisce (username, plaintext_password) dalla config WP.

    Se la password è ancora in plaintext (legacy) la usa raw e logga un warning
    — la migrazione di Batch 2 dovrebbe averla già cifrata all'avvio.
    """
    stored = config.wp_app_password_encrypted or ""
    if not stored:
        return (config.wp_username or "", "")
    if is_encrypted(stored):
        return (config.wp_username or "", decrypt(stored))
    logger.warning(
        "WP app password trovata in plaintext in DB: esegui la migrazione di cifratura."
    )
    return (config.wp_username or "", stored)


def _text_to_html(text: str) -> str:
    """Convert plain text to HTML paragraphs."""
    paragraphs = text.split("\n\n")
    parts = []
    for p in paragraphs:
        p = p.strip()
        if p:
            # Preserve single line breaks within a paragraph
            p = p.replace("\n", "<br>\n")
            parts.append(f"<p>{p}</p>")
    return "\n\n".join(parts)


def _get_wp_category_ids(db, article_id: int) -> list[int]:
    """Get WordPress category IDs for an article's assigned categories."""
    rows = db.execute(
        article_categories.select().where(article_categories.c.article_id == article_id)
    ).fetchall()
    if not rows:
        return []
    cat_ids = [r.category_id for r in rows]
    cats = db.query(Category).filter(Category.id.in_(cat_ids), Category.wp_id.isnot(None)).all()
    return [c.wp_id for c in cats]


def _get_wp_tag_ids(db, article_id: int) -> list[int]:
    """Get WordPress tag IDs for an article's assigned tags."""
    rows = db.execute(
        article_tags.select().where(article_tags.c.article_id == article_id)
    ).fetchall()
    if not rows:
        return []
    tag_ids = [r.tag_id for r in rows]
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids), Tag.wp_id.isnot(None)).all()
    return [t.wp_id for t in tags]


def _upload_featured_image(
    wp_base_url: str,
    auth: tuple[str, str],
    image_url: str,
) -> int | None:
    """Upload an image to the WP media library. Returns the WP media ID or None."""
    try:
        # Local upload: read from disk
        if image_url.startswith("/uploads/"):
            filename = image_url.split("/uploads/", 1)[1]
            filepath = os.path.join(settings.UPLOAD_DIR, filename)
            if not os.path.exists(filepath):
                logger.warning(f"Local image not found: {filepath}")
                return None
            with open(filepath, "rb") as f:
                file_bytes = f.read()
        else:
            # Remote URL: download
            resp = httpx.get(image_url, timeout=30, follow_redirects=True)
            resp.raise_for_status()
            file_bytes = resp.content
            # Derive filename from URL
            filename = image_url.rsplit("/", 1)[-1].split("?")[0] or "image.jpg"

        # Determine content type from extension
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        content_types = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                         "gif": "image/gif", "webp": "image/webp"}
        content_type = content_types.get(ext, "image/jpeg")

        media_url = f"{wp_base_url.rstrip('/')}/wp-json/wp/v2/media"
        response = httpx.post(
            media_url,
            content=file_bytes,
            headers={
                "Content-Type": content_type,
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
            auth=auth,
            timeout=60,
        )
        response.raise_for_status()
        return response.json().get("id")
    except Exception as e:
        logger.error(f"Featured image upload failed: {e}")
        return None


def _ensure_calendar_slot(db, article_id: int):
    """Ensure an EditorialSlot exists for the article (for calendar visibility)."""
    existing = db.query(EditorialSlot).filter(EditorialSlot.article_id == article_id).first()
    if existing:
        existing.status = "published"
    else:
        slot = EditorialSlot(
            article_id=article_id,
            scheduled_for=datetime.now(timezone.utc),
            status="published",
        )
        db.add(slot)


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
            wp_base = config.wp_url.rstrip("/")
            wp_auth = _wp_auth_credentials(config)

            # --- Build clean content ---
            content = ""
            if article.content_text:
                content = _text_to_html(article.content_text)

            post_data: dict = {
                "title": article.title,
                "content": content,
                "status": "publish",
            }

            # --- Categories & Tags ---
            wp_cats = _get_wp_category_ids(db, article_id)
            if wp_cats:
                post_data["categories"] = wp_cats

            wp_tags = _get_wp_tag_ids(db, article_id)
            if wp_tags:
                post_data["tags"] = wp_tags

            # --- Featured image ---
            if article.featured_image_url:
                media_id = _upload_featured_image(wp_base, wp_auth, article.featured_image_url)
                if media_id:
                    post_data["featured_media"] = media_id

            # --- Create post ---
            response = httpx.post(
                f"{wp_base}/wp-json/wp/v2/posts",
                json=post_data,
                auth=wp_auth,
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

            # --- Ensure calendar slot ---
            _ensure_calendar_slot(db, article_id)

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
