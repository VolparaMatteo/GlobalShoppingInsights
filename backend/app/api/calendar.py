from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_min_role
from app.database import get_db
from app.models.article import Article
from app.models.calendar import CalendarRule, EditorialSlot
from app.models.user import User
from app.schemas.calendar import (
    AutoPlanRequest,
    AutoPlanResponse,
    CalendarRuleResponse,
    CalendarRuleUpdate,
    CollisionCheckRequest,
    CollisionCheckResponse,
    SlotCreate,
    SlotResponse,
    SlotUpdate,
)
from app.schemas.common import MessageResponse
from app.services.auto_plan_service import generate_auto_plan

router = APIRouter(prefix="/slots", tags=["calendar"])


@router.get("", response_model=list[SlotResponse])
def list_slots(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(EditorialSlot)
    if start:
        query = query.filter(EditorialSlot.scheduled_for >= start)
    if end:
        query = query.filter(EditorialSlot.scheduled_for <= end)
    slots = query.order_by(EditorialSlot.scheduled_for.asc()).all()
    result = []
    for s in slots:
        resp = SlotResponse.model_validate(s)
        if s.article_id:
            article = db.query(Article).filter(Article.id == s.article_id).first()
            resp.article_title = article.title if article else None
        result.append(resp)
    return result


@router.post("", response_model=SlotResponse, status_code=201)
def create_slot(
    body: SlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    article = db.query(Article).filter(Article.id == body.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    existing = db.query(EditorialSlot).filter(EditorialSlot.article_id == body.article_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Article already scheduled")

    slot = EditorialSlot(
        article_id=body.article_id,
        scheduled_for=body.scheduled_for,
        timezone=body.timezone,
        created_by=current_user.id,
    )
    db.add(slot)
    if article.status == "approved":
        article.status = "scheduled"
    db.commit()
    db.refresh(slot)
    resp = SlotResponse.model_validate(slot)
    resp.article_title = article.title
    return resp


@router.patch("/{slot_id}", response_model=SlotResponse)
def update_slot(
    slot_id: int,
    body: SlotUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    slot = db.query(EditorialSlot).filter(EditorialSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(slot, key, value)
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", response_model=MessageResponse)
def delete_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    slot = db.query(EditorialSlot).filter(EditorialSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.article_id:
        article = db.query(Article).filter(Article.id == slot.article_id).first()
        if article and article.status == "scheduled":
            article.status = "approved"
    db.delete(slot)
    db.commit()
    return MessageResponse(message="Slot deleted")


@router.post("/check-collision", response_model=CollisionCheckResponse)
def check_collision(
    body: CollisionCheckRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    date = body.scheduled_for.date()
    query = db.query(EditorialSlot).filter(
        EditorialSlot.scheduled_for >= datetime.combine(date, datetime.min.time()),
        EditorialSlot.scheduled_for < datetime.combine(date, datetime.max.time()),
    )
    if body.exclude_slot_id:
        query = query.filter(EditorialSlot.id != body.exclude_slot_id)
    existing = query.all()

    max_rule = (
        db.query(CalendarRule)
        .filter(
            CalendarRule.rule_type == "max_posts_per_day",
            CalendarRule.is_active,
        )
        .first()
    )
    max_per_day = max_rule.value if max_rule else 10

    return CollisionCheckResponse(
        has_collision=len(existing) >= max_per_day,
        existing_slots=[SlotResponse.model_validate(s) for s in existing],
    )


@router.get("/rules", response_model=list[CalendarRuleResponse])
def get_rules(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return db.query(CalendarRule).all()


@router.post("/auto-plan", response_model=AutoPlanResponse)
def auto_plan_week(
    body: AutoPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    """Genera (o solo preview se `dry_run=True`) un piano editoriale settimanale.

    Vedi `app/services/auto_plan_service.py` per la logica.
    """
    try:
        result = generate_auto_plan(
            db,
            category=body.category,
            week_start=body.week_start,
            publish_time=body.publish_time,
            target_min_per_day=body.target_min_per_day,
            strategy=body.strategy,
            collision_strategy=body.collision_strategy,
            timezone=body.timezone,
            dry_run=body.dry_run,
            creator_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # AutoPlanResult (dataclass) → AutoPlanResponse (Pydantic) — campo per campo
    # per non legare il service ai modelli di trasporto.
    return AutoPlanResponse(
        week_start=result.week_start,
        week_end=result.week_end,
        category=result.category,
        target_min_per_day=result.target_min_per_day,
        strategy=result.strategy,
        days=[
            {
                "date": dp.date,
                "scheduled_for": dp.scheduled_for,
                "articles": [
                    {
                        "article_id": c.article_id,
                        "title": c.title,
                        "ai_score": c.ai_score,
                        "reading_time_min": c.reading_time_min,
                    }
                    for c in dp.articles
                ],
                "total_reading_min": dp.total_reading_min,
                "existing_slots": [
                    {
                        "slot_id": e.slot_id,
                        "article_id": e.article_id,
                        "article_title": e.article_title,
                        "scheduled_for": e.scheduled_for,
                    }
                    for e in dp.existing_slots
                ],
            }
            for dp in result.days
        ],
        summary={
            "pool_size": result.summary.pool_size,
            "articles_planned": result.summary.articles_planned,
            "articles_unscheduled": result.summary.articles_unscheduled,
            "total_reading_min": result.summary.total_reading_min,
            "avg_reading_min_per_day": result.summary.avg_reading_min_per_day,
            "days_filled": result.summary.days_filled,
            "collision_detected": result.summary.collision_detected,
            "existing_slots_in_week": result.summary.existing_slots_in_week,
            "warning": result.summary.warning,
            "error": result.summary.error,
        },
        created_slot_ids=result.created_slot_ids,
    )


@router.patch("/rules/{rule_id}", response_model=CalendarRuleResponse)
def update_rule(
    rule_id: int,
    body: CalendarRuleUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("admin")),
):
    rule = db.query(CalendarRule).filter(CalendarRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return rule
