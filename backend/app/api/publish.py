from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.article import Article
from app.models.wordpress import WPPost
from app.models.logs import JobLog
from app.schemas.wordpress import WPPostResponse
from app.schemas.common import MessageResponse, PaginatedResponse
from app.api.deps import get_current_user, require_min_role
from app.utils.pagination import paginate

router = APIRouter(prefix="/publish", tags=["publish"])


@router.post("/{article_id}", response_model=MessageResponse)
def publish_article(
    article_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.status not in ("approved", "scheduled"):
        raise HTTPException(status_code=400, detail=f"Article must be approved or scheduled, current: {article.status}")

    article.status = "publishing"
    db.commit()

    from app.services.wordpress_service import publish_to_wordpress
    background_tasks.add_task(publish_to_wordpress, article_id)
    return MessageResponse(message="Publishing started")


@router.post("/{article_id}/retry", response_model=MessageResponse)
def retry_publish(
    article_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.status != "publish_failed":
        raise HTTPException(status_code=400, detail="Article must be in publish_failed status")

    article.status = "publishing"
    db.commit()

    from app.services.wordpress_service import publish_to_wordpress
    background_tasks.add_task(publish_to_wordpress, article_id)
    return MessageResponse(message="Retry publishing started")


publish_jobs_router = APIRouter(prefix="/publish-jobs", tags=["publish"])


@publish_jobs_router.get("", response_model=PaginatedResponse[dict])
def list_publish_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(JobLog).filter(JobLog.job_type == "publish")
    total = query.count()
    jobs = query.order_by(JobLog.started_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [
        {
            "id": j.id, "job_type": j.job_type, "entity_ref": j.entity_ref,
            "status": j.status, "started_at": str(j.started_at) if j.started_at else None,
            "ended_at": str(j.ended_at) if j.ended_at else None,
            "error": j.error, "progress": j.progress,
        }
        for j in jobs
    ]
    return paginate(items, total, page, page_size)
