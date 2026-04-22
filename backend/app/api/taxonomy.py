import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from slugify import slugify
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_min_role
from app.database import get_db
from app.models.taxonomy import Category, Tag
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.taxonomy import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    TagCreate,
    TagResponse,
    TagUpdate,
)
from app.services.taxonomy_sync_service import (
    delete_category_from_wordpress,
    delete_tag_from_wordpress,
    push_category_to_wordpress,
    push_tag_to_wordpress,
    sync_from_wordpress,
)
from app.utils.pagination import paginate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["taxonomy"])


# --- Tags ---
@router.get("/tags", response_model=PaginatedResponse[TagResponse])
def list_tags(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Tag)
    if search:
        query = query.filter(Tag.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(Tag.name).offset((page - 1) * page_size).limit(page_size).all()
    return paginate(items, total, page, page_size)


@router.post("/tags", response_model=TagResponse, status_code=201)
def create_tag(
    body: TagCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    slug = body.slug or slugify(body.name)
    if db.query(Tag).filter(Tag.slug == slug).first():
        raise HTTPException(status_code=400, detail="Tag slug already exists")
    tag = Tag(name=body.name, slug=slug)
    db.add(tag)
    db.commit()
    db.refresh(tag)

    # Push to WordPress — rollback local if WP fails
    try:
        push_tag_to_wordpress(db, tag)
    except RuntimeError:
        # WordPress not configured — keep local only
        logger.info("WordPress not configured, tag created locally only")
    except Exception as e:
        logger.warning(f"Failed to push tag '{tag.name}' to WP: {e}")
        db.delete(tag)
        db.commit()
        raise HTTPException(
            status_code=502,
            detail=f"Impossibile creare il tag su WordPress: {e}",
        ) from e

    return tag


@router.patch("/tags/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    body: TagUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Push to WordPress FIRST if synced — abort on failure
    old_name, old_slug = tag.name, tag.slug
    if body.name is not None:
        tag.name = body.name
    if body.slug is not None:
        tag.slug = body.slug

    if tag.wp_id:
        try:
            push_tag_to_wordpress(db, tag)
        except Exception as e:
            # Revert in-memory changes
            tag.name, tag.slug = old_name, old_slug
            logger.warning(f"Failed to push tag update '{old_name}' to WP: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Impossibile aggiornare il tag su WordPress: {e}",
            ) from e

    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}", response_model=MessageResponse)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Delete from WordPress first
    if tag.wp_id:
        try:
            delete_tag_from_wordpress(db, tag)
        except Exception as e:
            logger.warning(f"Failed to delete tag '{tag.name}' from WP: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Impossibile eliminare il tag da WordPress: {e}",
            ) from e

    db.delete(tag)
    db.commit()
    return MessageResponse(message="Tag deleted")


# --- Categories ---
@router.get("/categories", response_model=PaginatedResponse[CategoryResponse])
def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: str | None = Query(None),
    parent_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Category)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    if parent_id is not None:
        query = query.filter(Category.parent_id == parent_id)
    total = query.count()
    items = query.order_by(Category.name).offset((page - 1) * page_size).limit(page_size).all()
    return paginate(items, total, page, page_size)


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    slug = body.slug or slugify(body.name)
    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(status_code=400, detail="Category slug already exists")
    cat = Category(name=body.name, slug=slug, parent_id=body.parent_id)
    db.add(cat)
    db.commit()
    db.refresh(cat)

    # Push to WordPress — rollback local if WP fails
    try:
        push_category_to_wordpress(db, cat)
    except RuntimeError:
        # WordPress not configured — keep local only
        logger.info("WordPress not configured, category created locally only")
    except Exception as e:
        logger.warning(f"Failed to push category '{cat.name}' to WP: {e}")
        db.delete(cat)
        db.commit()
        raise HTTPException(
            status_code=502,
            detail=f"Impossibile creare la categoria su WordPress: {e}",
        ) from e

    return cat


@router.patch("/categories/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Push to WordPress FIRST if synced — abort on failure
    old_name, old_slug, old_parent = cat.name, cat.slug, cat.parent_id
    if body.name is not None:
        cat.name = body.name
    if body.slug is not None:
        cat.slug = body.slug
    if body.parent_id is not None:
        cat.parent_id = body.parent_id

    if cat.wp_id:
        try:
            push_category_to_wordpress(db, cat)
        except Exception as e:
            # Revert in-memory changes
            cat.name, cat.slug, cat.parent_id = old_name, old_slug, old_parent
            logger.warning(f"Failed to push category update '{old_name}' to WP: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Impossibile aggiornare la categoria su WordPress: {e}",
            ) from e

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", response_model=MessageResponse)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Delete from WordPress first
    if cat.wp_id:
        try:
            delete_category_from_wordpress(db, cat)
        except Exception as e:
            logger.warning(f"Failed to delete category '{cat.name}' from WP: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Impossibile eliminare la categoria da WordPress: {e}",
            ) from e

    db.delete(cat)
    db.commit()
    return MessageResponse(message="Category deleted")


@router.post("/taxonomy/sync-wp", response_model=MessageResponse)
def sync_wp_taxonomy(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("admin")),
):
    try:
        result = sync_from_wordpress(db)
        t = result["tags"]
        c = result["categories"]
        message = (
            f"Sync completato — "
            f"Tag (da WP: {t['pulled']}, verso WP: {t['pushed']}, rimossi: {t['removed']}, errori: {t['errors']}), "
            f"Categorie (da WP: {c['pulled']}, verso WP: {c['pushed']}, rimossi: {c['removed']}, errori: {c['errors']})"
        )
        return MessageResponse(message=message)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("WP taxonomy sync failed")
        raise HTTPException(status_code=500, detail=f"Sync failed: {e}") from e
