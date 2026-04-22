from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.article import Article
from app.models.calendar import EditorialSlot
from app.models.logs import JobLog
from app.models.prompt import Prompt
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    total_articles = db.query(Article).count()
    imported = db.query(Article).filter(Article.status == "imported").count()
    in_review = db.query(Article).filter(Article.status == "in_review").count()
    approved = db.query(Article).filter(Article.status == "approved").count()
    published = db.query(Article).filter(Article.status == "published").count()
    scheduled = db.query(Article).filter(Article.status == "scheduled").count()
    rejected = db.query(Article).filter(Article.status == "rejected").count()

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_this_week = db.query(Article).filter(Article.created_at >= week_ago).count()

    avg_score = db.query(func.avg(Article.ai_score)).filter(Article.ai_score.isnot(None)).scalar()

    pending_slots = db.query(EditorialSlot).filter(EditorialSlot.status == "scheduled").count()

    return {
        "total_articles": total_articles,
        "by_status": {
            "imported": imported,
            "in_review": in_review,
            "approved": approved,
            "published": published,
            "scheduled": scheduled,
            "rejected": rejected,
        },
        "new_this_week": new_this_week,
        "avg_ai_score": round(avg_score, 1) if avg_score else None,
        "pending_slots": pending_slots,
    }


@router.get("/recent-jobs")
def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    jobs = db.query(JobLog).order_by(JobLog.started_at.desc()).limit(limit).all()

    # Resolve entity_ref "prompt:<id>" / "article:<id>" to actual titles
    prompt_ids = set()
    article_ids = set()
    for j in jobs:
        if j.entity_ref:
            kind, _, ref_id = j.entity_ref.partition(":")
            if kind == "prompt" and ref_id.isdigit():
                prompt_ids.add(int(ref_id))
            elif kind == "article" and ref_id.isdigit():
                article_ids.add(int(ref_id))

    prompt_titles = {}
    if prompt_ids:
        rows = db.query(Prompt.id, Prompt.title).filter(Prompt.id.in_(prompt_ids)).all()
        prompt_titles = {r.id: r.title for r in rows}

    article_titles = {}
    if article_ids:
        rows = db.query(Article.id, Article.title).filter(Article.id.in_(article_ids)).all()
        article_titles = {r.id: r.title for r in rows}

    def resolve_ref(entity_ref: str | None) -> str | None:
        if not entity_ref:
            return None
        kind, _, ref_id = entity_ref.partition(":")
        if ref_id.isdigit():
            rid = int(ref_id)
            if kind == "prompt":
                return prompt_titles.get(rid, entity_ref)
            if kind == "article":
                return article_titles.get(rid, entity_ref)
        return entity_ref

    return [
        {
            "id": j.id,
            "job_type": j.job_type,
            "entity_ref": resolve_ref(j.entity_ref),
            "status": j.status,
            "started_at": str(j.started_at) if j.started_at else None,
            "ended_at": str(j.ended_at) if j.ended_at else None,
            "error": j.error,
            "progress": j.progress,
        }
        for j in jobs
    ]


@router.get("/job-logs")
def list_job_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="filtro: pending/running/completed/failed"),
    job_type: str | None = Query(None, description="es. discovery, publish"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Lista paginata dei job_logs con filtri per status e job_type.

    Usata da /dashboard/alerts nel frontend per mostrare lo storico completo
    degli alert/job eseguiti dallo scheduler.
    """
    q = db.query(JobLog)
    if status:
        q = q.filter(JobLog.status == status)
    if job_type:
        q = q.filter(JobLog.job_type == job_type)

    total = q.count()
    jobs = (
        q.order_by(JobLog.started_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    )

    # Resolve entity_ref agli stessi titoli usati da /recent-jobs (DRY leggera).
    prompt_ids: set[int] = set()
    article_ids: set[int] = set()
    for j in jobs:
        if j.entity_ref:
            kind, _, ref_id = j.entity_ref.partition(":")
            if kind == "prompt" and ref_id.isdigit():
                prompt_ids.add(int(ref_id))
            elif kind == "article" and ref_id.isdigit():
                article_ids.add(int(ref_id))

    prompt_titles: dict[int, str] = {}
    if prompt_ids:
        rows = db.query(Prompt.id, Prompt.title).filter(Prompt.id.in_(prompt_ids)).all()
        prompt_titles = {r.id: r.title for r in rows}

    article_titles: dict[int, str] = {}
    if article_ids:
        rows = db.query(Article.id, Article.title).filter(Article.id.in_(article_ids)).all()
        article_titles = {r.id: r.title for r in rows}

    def resolve_ref(entity_ref: str | None) -> str | None:
        if not entity_ref:
            return None
        kind, _, ref_id = entity_ref.partition(":")
        if ref_id.isdigit():
            rid = int(ref_id)
            if kind == "prompt":
                return prompt_titles.get(rid, entity_ref)
            if kind == "article":
                return article_titles.get(rid, entity_ref)
        return entity_ref

    return {
        "items": [
            {
                "id": j.id,
                "job_type": j.job_type,
                "entity_ref": resolve_ref(j.entity_ref),
                "status": j.status,
                "started_at": str(j.started_at) if j.started_at else None,
                "ended_at": str(j.ended_at) if j.ended_at else None,
                "error": j.error,
                "progress": j.progress,
            }
            for j in jobs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    alerts = []
    failed_jobs = (
        db.query(JobLog)
        .filter(JobLog.status == "failed")
        .order_by(JobLog.started_at.desc())
        .limit(5)
        .all()
    )
    for j in failed_jobs:
        alerts.append(
            {
                "type": "job_failed",
                "message": f"{j.job_type} job failed: {j.error or 'Unknown error'}",
                "entity_ref": j.entity_ref,
                "timestamp": str(j.started_at) if j.started_at else None,
            }
        )

    failed_publish = db.query(Article).filter(Article.status == "publish_failed").count()
    if failed_publish > 0:
        alerts.append(
            {
                "type": "publish_failed",
                "message": f"{failed_publish} article(s) failed to publish",
                "entity_ref": None,
                "timestamp": None,
            }
        )

    return alerts
