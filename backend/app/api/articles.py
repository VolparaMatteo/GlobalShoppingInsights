import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_min_role
from app.config import settings
from app.database import get_db
from app.models.article import (
    Article,
    ArticleRevision,
    article_categories,
    article_prompts,
    article_tags,
)
from app.models.prompt import Prompt
from app.models.taxonomy import Category, Tag
from app.models.user import User
from app.schemas.article import (
    ArticleResponse,
    ArticleUpdate,
    BatchActionRequest,
    PromptSummary,
    RevisionResponse,
    StatusChangeRequest,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.pagination import paginate

router = APIRouter(prefix="/articles", tags=["articles"])


def _enrich_article(a: Article, db: Session) -> ArticleResponse:
    """Build an ArticleResponse with tags, categories and prompts."""
    resp = ArticleResponse.model_validate(a)
    tags = db.execute(article_tags.select().where(article_tags.c.article_id == a.id)).fetchall()
    cats = db.execute(
        article_categories.select().where(article_categories.c.article_id == a.id)
    ).fetchall()
    tag_objs = db.query(Tag).filter(Tag.id.in_([t.tag_id for t in tags])).all() if tags else []
    cat_objs = (
        db.query(Category).filter(Category.id.in_([c.category_id for c in cats])).all()
        if cats
        else []
    )
    resp.tags = [{"id": t.id, "name": t.name, "slug": t.slug} for t in tag_objs]
    resp.categories = [{"id": c.id, "name": c.name, "slug": c.slug} for c in cat_objs]
    prompt_links = db.execute(
        article_prompts.select().where(article_prompts.c.article_id == a.id)
    ).fetchall()
    if prompt_links:
        prompt_objs = (
            db.query(Prompt).filter(Prompt.id.in_([p.prompt_id for p in prompt_links])).all()
        )
        resp.prompts = [PromptSummary.model_validate(p) for p in prompt_objs]
    return resp


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
    status_filter: str | None = Query(None, alias="status"),
    language: str | None = None,
    country: str | None = None,
    domain: str | None = None,
    search: str | None = None,
    min_score: int | None = None,
    max_score: int | None = None,
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

    items = [_enrich_article(a, db) for a in articles]

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
    return _enrich_article(article, db)


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
            changes.append(
                {"field": key, "old": str(old_value) if old_value else None, "new": str(value)}
            )
            setattr(article, key, value)

    if changes:
        max_version = (
            db.query(ArticleRevision).filter(ArticleRevision.article_id == article_id).count()
        )
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
    force: bool = Query(False, description="Skip workflow validation (editor+ only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if force:
        # Force mode: editors and above can set any valid status
        if current_user.role not in ("editor", "reviewer", "admin"):
            raise HTTPException(
                status_code=403, detail="Force status change requires editor role or above"
            )
        all_statuses = set(WORKFLOW_TRANSITIONS.keys()) | {"published"}
        if body.new_status not in all_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status: {body.new_status}")
    else:
        allowed = WORKFLOW_TRANSITIONS.get(article.status, set())
        if body.new_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {article.status} to {body.new_status}",
            )
        required_roles = TRANSITION_ROLES.get((article.status, body.new_status), [])
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=403, detail="Insufficient permissions for this transition"
            )

    article.status = body.new_status
    db.commit()
    db.refresh(article)
    return _enrich_article(article, db)


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
    return {"from": article.status, "allowed": available}


@router.get("/{article_id}/revisions", response_model=list[RevisionResponse])
def get_revisions(
    article_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    revisions = (
        db.query(ArticleRevision)
        .filter(ArticleRevision.article_id == article_id)
        .order_by(ArticleRevision.version.desc())
        .all()
    )
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
    duplicates = db.query(Article).filter(Article.duplicate_of_id == article_id).all()
    same_hash = []
    if article.content_hash:
        same_hash = (
            db.query(Article)
            .filter(
                Article.content_hash == article.content_hash,
                Article.id != article_id,
            )
            .all()
        )
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
                        (article_tags.c.article_id == article.id)
                        & (article_tags.c.tag_id == tag_id)
                    )
                ).first()
                if not existing:
                    db.execute(article_tags.insert().values(article_id=article.id, tag_id=tag_id))
    elif body.action == "category" and body.category_ids:
        for article in articles:
            for cat_id in body.category_ids:
                existing = db.execute(
                    article_categories.select().where(
                        (article_categories.c.article_id == article.id)
                        & (article_categories.c.category_id == cat_id)
                    )
                ).first()
                if not existing:
                    db.execute(
                        article_categories.insert().values(
                            article_id=article.id, category_id=cat_id
                        )
                    )
    elif body.action == "discard":
        for article in articles:
            if article.status in ("imported", "screened"):
                article.status = "rejected"

    db.commit()
    return MessageResponse(
        message=f"Batch action '{body.action}' applied to {len(articles)} articles"
    )


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/{article_id}/upload-image", response_model=ArticleResponse)
def upload_article_image(
    article_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, detail="Tipo file non supportato. Usa JPEG, PNG, WebP o GIF."
        )

    contents = file.file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Il file supera la dimensione massima di 5 MB.")

    ext = (
        file.filename.rsplit(".", 1)[-1].lower()
        if file.filename and "." in file.filename
        else "jpg"
    )
    filename = f"{article_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Delete old local image if present
    old_url = article.featured_image_url
    if old_url and old_url.startswith("/uploads/"):
        old_path = os.path.join(settings.UPLOAD_DIR, old_url.split("/uploads/", 1)[1])
        if os.path.exists(old_path):
            os.remove(old_path)

    article.featured_image_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(article)
    return _enrich_article(article, db)


@router.post("/{article_id}/translate")
def translate_article(
    article_id: int,
    target_lang: str = Query("it"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    from deep_translator import GoogleTranslator

    source_lang = article.language or "auto"
    translator = GoogleTranslator(source=source_lang, target=target_lang)

    translated_title = None
    if article.title:
        translated_title = translator.translate(article.title)

    translated_text = None
    if article.content_text:
        # Translate first 1500 chars for preview (Google Translate has limits)
        preview = article.content_text[:1500]
        translated_text = translator.translate(preview)

    return {
        "article_id": article_id,
        "source_lang": source_lang,
        "target_lang": target_lang,
        "translated_title": translated_title,
        "translated_text": translated_text,
    }
