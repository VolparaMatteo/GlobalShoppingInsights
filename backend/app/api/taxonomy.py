from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from slugify import slugify
from app.database import get_db
from app.models.user import User
from app.models.taxonomy import Tag, Category
from app.schemas.taxonomy import (
    TagCreate, TagUpdate, TagResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
)
from app.schemas.common import MessageResponse
from app.api.deps import get_current_user, require_min_role

router = APIRouter(tags=["taxonomy"])


# --- Tags ---
@router.get("/tags", response_model=List[TagResponse])
def list_tags(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return db.query(Tag).order_by(Tag.name).all()


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
    if body.name is not None:
        tag.name = body.name
    if body.slug is not None:
        tag.slug = body.slug
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
    db.delete(tag)
    db.commit()
    return MessageResponse(message="Tag deleted")


# --- Categories ---
@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return db.query(Category).order_by(Category.name).all()


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
    if body.name is not None:
        cat.name = body.name
    if body.slug is not None:
        cat.slug = body.slug
    if body.parent_id is not None:
        cat.parent_id = body.parent_id
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
    db.delete(cat)
    db.commit()
    return MessageResponse(message="Category deleted")


@router.post("/taxonomy/sync-wp", response_model=MessageResponse)
def sync_wp_taxonomy(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("admin")),
):
    # WP sync will be implemented in Phase 6
    return MessageResponse(message="WordPress taxonomy sync initiated")
