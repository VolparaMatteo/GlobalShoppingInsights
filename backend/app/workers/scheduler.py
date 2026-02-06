import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.prompt import Prompt
from app.models.calendar import EditorialSlot

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def start_scheduler():
    scheduler.add_job(
        check_scheduled_prompts,
        IntervalTrigger(minutes=5),
        id="check_prompts",
        replace_existing=True,
    )
    scheduler.add_job(
        check_publishing_slots,
        IntervalTrigger(minutes=1),
        id="check_publishing",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")


def check_scheduled_prompts():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        prompts = db.query(Prompt).filter(
            Prompt.schedule_enabled == True,
            Prompt.is_active == True,
            Prompt.schedule_next_run_at <= now,
        ).all()

        for prompt in prompts:
            try:
                from app.services.discovery_service import run_discovery_pipeline
                run_discovery_pipeline(prompt.id)

                if prompt.schedule_frequency_hours:
                    from datetime import timedelta
                    prompt.schedule_next_run_at = now + timedelta(hours=prompt.schedule_frequency_hours)
                    db.commit()
            except Exception as e:
                logger.error(f"Scheduled prompt {prompt.id} failed: {e}")
    finally:
        db.close()


def check_publishing_slots():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        slots = db.query(EditorialSlot).filter(
            EditorialSlot.status == "scheduled",
            EditorialSlot.scheduled_for <= now,
        ).all()

        for slot in slots:
            try:
                if slot.article_id:
                    from app.models.article import Article
                    article = db.query(Article).filter(Article.id == slot.article_id).first()
                    if article and article.status == "scheduled":
                        article.status = "publishing"
                        slot.status = "publishing"
                        db.commit()

                        from app.services.wordpress_service import publish_to_wordpress
                        publish_to_wordpress(article.id)

                        db.refresh(article)
                        slot.status = "published" if article.status == "published" else "failed"
                        db.commit()
            except Exception as e:
                logger.error(f"Publishing slot {slot.id} failed: {e}")
                slot.status = "failed"
                db.commit()
    finally:
        db.close()
