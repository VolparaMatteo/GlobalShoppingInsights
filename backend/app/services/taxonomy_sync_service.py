import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.taxonomy import Tag, Category
from app.models.wordpress import WPConfig

logger = logging.getLogger(__name__)


def _get_wp_config(db: Session) -> WPConfig:
    config = db.query(WPConfig).filter(WPConfig.id == 1).first()
    if not config or not config.wp_url or not config.wp_username:
        raise RuntimeError("WordPress not configured")
    return config


def _wp_client(config: WPConfig) -> httpx.Client:
    password = config.wp_app_password_encrypted or ""
    return httpx.Client(
        base_url=config.wp_url.rstrip("/") + "/wp-json/wp/v2",
        auth=(config.wp_username, password),
        timeout=30,
    )


def _fetch_all_wp_items(client: httpx.Client, endpoint: str) -> list[dict]:
    """Fetch all items from a paginated WP REST API endpoint."""
    items: list[dict] = []
    page = 1
    while True:
        resp = client.get(f"/{endpoint}", params={"per_page": 100, "page": page})
        resp.raise_for_status()
        items.extend(resp.json())
        total_pages = int(resp.headers.get("X-WP-TotalPages", "1"))
        if page >= total_pages:
            break
        page += 1
    return items


def sync_from_wordpress(db: Session) -> dict:
    """Bidirectional sync: WP ↔ GSI for tags and categories.

    1. Pull WP items → upsert locally
    2. Push local-only items (no wp_id) → create on WP
    3. Remove local orphans (wp_id set but no longer on WP)
    """
    config = _get_wp_config(db)
    result = {
        "tags": {"pulled": 0, "pushed": 0, "removed": 0, "errors": 0},
        "categories": {"pulled": 0, "pushed": 0, "removed": 0, "errors": 0},
    }

    with _wp_client(config) as client:
        # ==== TAGS ====
        try:
            wp_tags = _fetch_all_wp_items(client, "tags")
        except Exception as e:
            logger.error(f"Failed to fetch WP tags: {e}")
            wp_tags = []
            result["tags"]["errors"] += 1

        wp_tag_ids = {wt["id"] for wt in wp_tags}

        # 1) Pull: upsert WP tags locally
        for wt in wp_tags:
            try:
                _upsert_tag(db, wt)
                db.flush()
                result["tags"]["pulled"] += 1
            except Exception as e:
                logger.error(f"Error syncing WP tag {wt.get('id')}: {e}")
                db.rollback()
                result["tags"]["errors"] += 1

        # 2) Push: local tags without wp_id → create on WP
        local_only_tags = db.query(Tag).filter(Tag.wp_id.is_(None)).all()
        for tag in local_only_tags:
            try:
                payload = {"name": tag.name, "slug": tag.slug}
                resp = client.post("/tags", json=payload)
                resp.raise_for_status()
                wp_data = resp.json()
                tag.wp_id = wp_data["id"]
                db.flush()
                result["tags"]["pushed"] += 1
            except Exception as e:
                logger.error(f"Error pushing local tag '{tag.name}' to WP: {e}")
                result["tags"]["errors"] += 1

        # 3) Remove: local tags with wp_id that no longer exist on WP
        if wp_tag_ids:  # only if we successfully fetched WP tags
            orphan_tags = (
                db.query(Tag)
                .filter(Tag.wp_id.isnot(None), Tag.wp_id.notin_(wp_tag_ids))
                .all()
            )
            for tag in orphan_tags:
                logger.info(f"Removing orphan tag '{tag.name}' (wp_id={tag.wp_id})")
                db.delete(tag)
                result["tags"]["removed"] += 1

        # ==== CATEGORIES ====
        try:
            wp_cats = _fetch_all_wp_items(client, "categories")
        except Exception as e:
            logger.error(f"Failed to fetch WP categories: {e}")
            wp_cats = []
            result["categories"]["errors"] += 1

        wp_cat_ids = {wc["id"] for wc in wp_cats}

        # 1) Pull pass 1: upsert all categories (without parent linking)
        for wc in wp_cats:
            try:
                _upsert_category(db, wc, link_parent=False)
                db.flush()
                result["categories"]["pulled"] += 1
            except Exception as e:
                logger.error(f"Error syncing WP category {wc.get('id')}: {e}")
                db.rollback()
                result["categories"]["errors"] += 1

        # Pull pass 2: link parents
        for wc in wp_cats:
            wp_parent = wc.get("parent", 0)
            if wp_parent:
                cat = db.query(Category).filter(Category.wp_id == wc["id"]).first()
                parent = db.query(Category).filter(Category.wp_id == wp_parent).first()
                if cat and parent:
                    cat.parent_id = parent.id

        # 2) Push: local categories without wp_id → create on WP
        local_only_cats = db.query(Category).filter(Category.wp_id.is_(None)).all()
        for cat in local_only_cats:
            try:
                payload = {"name": cat.name, "slug": cat.slug}
                if cat.parent_id:
                    parent = db.query(Category).filter(Category.id == cat.parent_id).first()
                    if parent and parent.wp_id:
                        payload["parent"] = parent.wp_id
                resp = client.post("/categories", json=payload)
                resp.raise_for_status()
                wp_data = resp.json()
                cat.wp_id = wp_data["id"]
                db.flush()
                result["categories"]["pushed"] += 1
            except Exception as e:
                logger.error(f"Error pushing local category '{cat.name}' to WP: {e}")
                result["categories"]["errors"] += 1

        # 3) Remove: local categories with wp_id that no longer exist on WP
        if wp_cat_ids:  # only if we successfully fetched WP categories
            orphan_cats = (
                db.query(Category)
                .filter(Category.wp_id.isnot(None), Category.wp_id.notin_(wp_cat_ids))
                .all()
            )
            for cat in orphan_cats:
                logger.info(f"Removing orphan category '{cat.name}' (wp_id={cat.wp_id})")
                db.delete(cat)
                result["categories"]["removed"] += 1

        db.commit()

    config.last_sync_at = datetime.now(timezone.utc)
    db.commit()

    return result


def _resolve_slug(db: Session, model, slug: str, wp_id: int) -> str:
    """Ensure slug is unique; append -wp if taken by a different item."""
    existing = db.query(model).filter(model.slug == slug).first()
    if existing and existing.wp_id != wp_id:
        slug = slug + "-wp"
        # If even that is taken, let it pass — unique constraint will catch it
    return slug


def _upsert_tag(db: Session, wt: dict) -> None:
    wp_id = wt["id"]
    name = wt.get("name", "")
    slug = wt.get("slug", "")

    # Match by wp_id first, then by slug
    tag = db.query(Tag).filter(Tag.wp_id == wp_id).first()
    if not tag:
        tag = db.query(Tag).filter(Tag.slug == slug).first()

    if tag:
        tag.name = name
        tag.slug = slug
        tag.wp_id = wp_id
    else:
        resolved_slug = _resolve_slug(db, Tag, slug, wp_id)
        tag = Tag(name=name, slug=resolved_slug, wp_id=wp_id)
        db.add(tag)


def _upsert_category(db: Session, wc: dict, link_parent: bool = True) -> None:
    wp_id = wc["id"]
    name = wc.get("name", "")
    slug = wc.get("slug", "")

    cat = db.query(Category).filter(Category.wp_id == wp_id).first()
    if not cat:
        cat = db.query(Category).filter(Category.slug == slug).first()

    if cat:
        cat.name = name
        cat.slug = slug
        cat.wp_id = wp_id
    else:
        resolved_slug = _resolve_slug(db, Category, slug, wp_id)
        cat = Category(name=name, slug=resolved_slug, wp_id=wp_id)
        db.add(cat)

    if link_parent:
        wp_parent = wc.get("parent", 0)
        if wp_parent:
            parent = db.query(Category).filter(Category.wp_id == wp_parent).first()
            if parent:
                cat.parent_id = parent.id
        else:
            cat.parent_id = None


def delete_tag_from_wordpress(db: Session, tag: Tag) -> None:
    """Delete a tag from WordPress by its wp_id."""
    if not tag.wp_id:
        return
    config = _get_wp_config(db)
    with _wp_client(config) as client:
        resp = client.delete(f"/tags/{tag.wp_id}", params={"force": True})
        resp.raise_for_status()


def delete_category_from_wordpress(db: Session, category: Category) -> None:
    """Delete a category from WordPress by its wp_id."""
    if not category.wp_id:
        return
    config = _get_wp_config(db)
    with _wp_client(config) as client:
        resp = client.delete(f"/categories/{category.wp_id}", params={"force": True})
        resp.raise_for_status()


def push_tag_to_wordpress(db: Session, tag: Tag) -> Optional[int]:
    """Create or update a tag on WordPress. Returns the WP tag ID."""
    config = _get_wp_config(db)
    with _wp_client(config) as client:
        payload = {"name": tag.name, "slug": tag.slug}

        if tag.wp_id:
            resp = client.post(f"/tags/{tag.wp_id}", json=payload)
        else:
            resp = client.post("/tags", json=payload)

        resp.raise_for_status()
        wp_data = resp.json()
        tag.wp_id = wp_data["id"]
        db.commit()
        return tag.wp_id


def push_category_to_wordpress(db: Session, category: Category) -> Optional[int]:
    """Create or update a category on WordPress. Returns the WP category ID."""
    config = _get_wp_config(db)
    with _wp_client(config) as client:
        payload = {"name": category.name, "slug": category.slug}

        # Map local parent_id to WP parent
        if category.parent_id:
            parent = db.query(Category).filter(Category.id == category.parent_id).first()
            if parent and parent.wp_id:
                payload["parent"] = parent.wp_id

        if category.wp_id:
            resp = client.post(f"/categories/{category.wp_id}", json=payload)
        else:
            resp = client.post("/categories", json=payload)

        resp.raise_for_status()
        wp_data = resp.json()
        category.wp_id = wp_data["id"]
        db.commit()
        return category.wp_id
