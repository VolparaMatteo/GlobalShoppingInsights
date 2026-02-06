from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleRevision, article_tags, article_categories
from app.models.taxonomy import Tag, Category
from app.schemas.article import ArticleUpdate, StatusChangeRequest, BatchActionRequest, ArticleResponse, RevisionResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.api.deps import get_current_user, require_min_role
from app.utils.pagination import paginate

router = APIRouter(prefix="/articles", tags=["articles"])

WORKFLOW_TRANSITIONS = {
    "imported": {"screened", "rejected"},
    "screened": {"in_review", "rejected"},
    "in_review": {"approved", "rejected", "screened"},
    "approved": {"scheduled"},
    "scheduled": {"approved", "publishing"},
    "publishing": {"published", "publish_failed"},
    "publish_failed": {"scheduled"},
    "rejected": {"imported"},
}

TRANSITION_ROLES = {
    ("imported", "screened"): ["contributor", "editor", "reviewer", "admin"],
    ("imported", "rejected"): ["editor", "reviewer", "admin"],
    ("screened", "in_review"): ["editor", "admin"],
    ("screened", "rejected"): ["editor", "reviewer", "admin"],
    ("in_review", "approved"): ["reviewer", "admin"],
    ("in_review", "rejected"): ["reviewer", "admin"],
    ("in_review", "screened"): ["reviewer", "admin"],
    ("approved", "scheduled"): ["editor", "reviewer", "admin"],
    ("scheduled", "approved"): ["editor", "reviewer", "admin"],
    ("scheduled", "publishing"): ["admin"],
    ("publishing", "published"): ["admin"],
    ("publishing", "publish_failed"): ["admin"],
    ("publish_failed", "scheduled"): ["editor", "reviewer", "admin"],
    ("rejected", "imported"): ["admin"],
}


@router.get("", response_model=PaginatedResponse[ArticleResponse])
def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = None,
    country: Optional[str] = None,
    domain: Optional[str] = None,
    search: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Article)
    if status_filter:
        query = query.filter(Article.status == status_filter)
    if language:
        query = query.filter(Article.language == language)
    if country:
        query = query.filter(Article.country == country)
    if domain:
        query = query.filter(Article.source_domain.ilike(f"%{domain}%"))
    if search:
        query = query.filter(Article.title.ilike(f"%{search}%"))
    if min_score is not None:
        query = query.filter(Article.ai_score >= min_score)
    if max_score is not None:
        query = query.filter(Article.ai_score <= max_score)

    sort_col = getattr(Article, sort_by, Article.created_at)
    query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    total = query.count()
    articles = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for a in articles:
        resp = ArticleResponse.model_validate(a)
        tags = db.execute(article_tags.select().where(article_tags.c.article_id == a.id)).fetchall()
        cats = db.execute(article_categories.select().where(article_categories.c.article_id == a.id)).fetchall()
        tag_objs = db.query(Tag).filter(Tag.id.in_([t.tag_id for t in tags])).all() if tags else []
        cat_objs = db.query(Category).filter(Category.id.in_([c.category_id for c in cats])).all() if cats else []
        resp.tags = [{"id": t.id, "name": t.name, "slug": t.slug} for t in tag_objs]
        resp.categories = [{"id": c.id, "name": c.name, "slug": c.slug} for c in cat_objs]
        items.append(resp)

    return paginate(items, total, page, page_size)


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    resp = ArticleResponse.model_validate(article)
    tags = db.execute(article_tags.select().where(article_tags.c.article_id == article.id)).fetchall()
    cats = db.execute(article_categories.select().where(article_categories.c.article_id == article.id)).fetchall()
    tag_objs = db.query(Tag).filter(Tag.id.in_([t.tag_id for t in tags])).all() if tags else []
    cat_objs = db.query(Category).filter(Category.id.in_([c.category_id for c in cats])).all() if cats else []
    resp.tags = [{"id": t.id, "name": t.name, "slug": t.slug} for t in tag_objs]
    resp.categories = [{"id": c.id, "name": c.name, "slug": c.slug} for c in cat_objs]
    return resp


@router.patch("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    body: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    changes = []
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        old_value = getattr(article, key)
        if old_value != value:
            changes.append({"field": key, "old": str(old_value) if old_value else None, "new": str(value)})
            setattr(article, key, value)

    if changes:
        max_version = db.query(ArticleRevision).filter(
            ArticleRevision.article_id == article_id
        ).count()
        revision = ArticleRevision(
            article_id=article_id,
            version=max_version + 1,
            editor_id=current_user.id,
            changes=changes,
        )
        db.add(revision)

    db.commit()
    db.refresh(article)
    return article


@router.post("/{article_id}/status", response_model=ArticleResponse)
def change_status(
    article_id: int,
    body: StatusChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    allowed = WORKFLOW_TRANSITIONS.get(article.status, set())
    if body.new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Cannot transition from {article.status} to {body.new_status}")

    required_roles = TRANSITION_ROLES.get((article.status, body.new_status), [])
    if current_user.role not in required_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions for this transition")

    old_status = article.status
    article.status = body.new_status
    db.commit()
    db.refresh(article)
    return article


@router.get("/{article_id}/transitions")
def get_transitions(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    allowed = WORKFLOW_TRANSITIONS.get(article.status, set())
    available = []
    for target in allowed:
        roles = TRANSITION_ROLES.get((article.status, target), [])
        if current_user.role in roles:
            available.append(target)
    return {"current_status": article.status, "available_transitions": available}


@router.get("/{article_id}/revisions", response_model=List[RevisionResponse])
def get_revisions(
    article_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    revisions = db.query(ArticleRevision).filter(
        ArticleRevision.article_id == article_id
    ).order_by(ArticleRevision.version.desc()).all()
    return revisions


@router.get("/{article_id}/duplicates")
def get_duplicates(
    article_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    duplicates = db.query(Article).filter(
        Article.duplicate_of_id == article_id
    ).all()
    same_hash = []
    if article.content_hash:
        same_hash = db.query(Article).filter(
            Article.content_hash == article.content_hash,
            Article.id != article_id,
        ).all()
    all_dupes = {a.id: ArticleResponse.model_validate(a) for a in duplicates + same_hash}
    return list(all_dupes.values())


@router.post("/batch", response_model=MessageResponse)
def batch_action(
    body: BatchActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    articles = db.query(Article).filter(Article.id.in_(body.article_ids)).all()
    if not articles:
        raise HTTPException(status_code=404, detail="No articles found")

    if body.action == "status" and body.new_status:
        for article in articles:
            allowed = WORKFLOW_TRANSITIONS.get(article.status, set())
            if body.new_status in allowed:
                roles = TRANSITION_ROLES.get((article.status, body.new_status), [])
                if current_user.role in roles:
                    article.status = body.new_status
    elif body.action == "tag" and body.tag_ids:
        for article in articles:
            for tag_id in body.tag_ids:
                existing = db.execute(
                    article_tags.select().where(
                        (article_tags.c.article_id == article.id) & (article_tags.c.tag_id == tag_id)
                    )
                ).first()
                if not existing:
                    db.execute(article_tags.insert().values(article_id=article.id, tag_id=tag_id))
    elif body.action == "discard":
        for article in articles:
            if article.status in ("imported", "screened"):
                article.status = "rejected"

    db.commit()
    return MessageResponse(message=f"Batch action '{body.action}' applied to {len(articles)} articles")
