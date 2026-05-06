"""
Generazione automatica del piano editoriale settimanale.

Dato:
- una macrocategoria editoriale (es. STRATEGY, INNOVATION, ...)
- l'inizio settimana (lunedì)
- l'orario di pubblicazione desiderato
- il target di lettura medio per giorno (in minuti)
- la strategia (cap → rispetta target / spread → distribuisci tutto)

Restituisce un piano giorno-per-giorno con gli articoli scelti, calcolato in
preview (`dry_run=True`) o effettivamente persistito.

Politiche:
- Pool sorgente: SOLO articoli `status='approved'` (esclusi imported, screened,
  in_review, rejected, scheduled, publishing, published). Esattamente quanto
  l'utente ha richiesto: "solo approvati non ancora pubblicati".
- Filtro categoria: stesso meccanismo del filtro Inbox — risale i 3 livelli
  della folder hierarchy dei prompt fino alla macrocategoria root.
- Ordinamento candidati: ai_score DESC (più rilevanti prima), tie-break
  reading_time ASC (i corti prima a parità di score → riempie meglio).
- Round-robin pesato: assegna ogni articolo al giorno meno carico (in minuti)
  che ha ancora slot disponibili.
- max_posts_per_day: rispettato sempre (regola CalendarRule, default 10).

Collisioni (slot già esistenti nella settimana):
- `fail`     → solleva ValueError se ci sono già slot
- `integrate`→ tiene gli slot esistenti, riempie i posti liberi rispetto a max
- `replace`  → cancella tutti gli slot esistenti della settimana e ripianifica
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.models.article import Article, article_prompts
from app.models.calendar import CalendarRule, EditorialSlot
from app.models.prompt import Prompt
from app.models.prompt_folder import PromptFolder
from app.utils.reading_time import compute_reading_time

DEFAULT_MAX_POSTS_PER_DAY = 10
WEEK_DAYS = 7


# ---------------------------------------------------------------------------
# Domain types — esposti via schemi Pydantic, qui sono dataclass per la logica.
# ---------------------------------------------------------------------------


@dataclass
class CandidateArticle:
    article_id: int
    title: str
    ai_score: int | None
    reading_time_min: int


@dataclass
class ExistingSlotInfo:
    slot_id: int
    article_id: int | None
    article_title: str | None
    scheduled_for: datetime


@dataclass
class DayPlan:
    date: date
    scheduled_for: datetime  # combinazione date + publish_time, già in TZ
    articles: list[CandidateArticle] = field(default_factory=list)
    total_reading_min: int = 0
    existing_slots: list[ExistingSlotInfo] = field(default_factory=list)


@dataclass
class AutoPlanSummary:
    pool_size: int
    articles_planned: int
    articles_unscheduled: int
    total_reading_min: int
    avg_reading_min_per_day: float
    days_filled: int
    collision_detected: bool
    existing_slots_in_week: int
    warning: str | None
    error: str | None


@dataclass
class AutoPlanResult:
    week_start: date
    week_end: date
    category: str
    target_min_per_day: int
    strategy: Literal["cap", "spread"]
    days: list[DayPlan]
    summary: AutoPlanSummary
    created_slot_ids: list[int]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def generate_auto_plan(
    db: Session,
    *,
    category: str,
    week_start: date,
    publish_time: time,
    target_min_per_day: int,
    strategy: Literal["cap", "spread"] = "spread",
    collision_strategy: Literal["fail", "integrate", "replace"] = "integrate",
    timezone: str = "Europe/Rome",
    dry_run: bool = True,
    creator_id: int | None = None,
) -> AutoPlanResult:
    """Costruisce (e opzionalmente persiste) il piano settimanale.

    Solleva ValueError per:
    - target_min_per_day <= 0
    - settimana già occupata e collision_strategy='fail'
    """
    if target_min_per_day <= 0:
        raise ValueError("target_min_per_day deve essere > 0")

    tz = ZoneInfo(timezone)
    days = [week_start + timedelta(days=i) for i in range(WEEK_DAYS)]
    week_end = days[-1]

    # Slot già presenti per ogni giorno della settimana
    existing_by_day = _existing_slots_by_day(db, days, tz)
    total_existing = sum(len(s) for s in existing_by_day.values())
    collision_detected = total_existing > 0

    if collision_detected and collision_strategy == "fail":
        raise ValueError(
            f"Settimana {week_start.isoformat()} già occupata da {total_existing} slot. "
            "Scegli una strategia di gestione collisione."
        )

    # Pool candidati: approved nella categoria, ordinati per (ai_score DESC, reading_time ASC).
    pool = _approved_candidates_in_category(db, category)
    candidates: list[CandidateArticle] = []
    for a in pool:
        rt = compute_reading_time(a.content_text)
        candidates.append(
            CandidateArticle(
                article_id=a.id,
                title=a.title,
                ai_score=a.ai_score,
                reading_time_min=rt,
            )
        )
    # Sort: ai_score DESC (None ultimi), reading_time ASC come tie-break.
    candidates.sort(key=lambda c: (-(c.ai_score or 0), c.reading_time_min))

    max_per_day = _get_max_posts_per_day(db)

    # Build initial day plans con eventuali slot già esistenti
    plan: list[DayPlan] = []
    for d in days:
        local_dt = datetime.combine(d, publish_time, tzinfo=tz)
        existing = existing_by_day.get(d, [])
        plan.append(
            DayPlan(
                date=d,
                scheduled_for=local_dt,
                articles=[],
                total_reading_min=0,
                existing_slots=existing if collision_strategy != "replace" else [],
            )
        )

    # Slot disponibili per giorno tenendo conto di esistenti (a meno che replace)
    available = {}
    for dp in plan:
        already = len(dp.existing_slots) if collision_strategy != "replace" else 0
        available[dp.date] = max(0, max_per_day - already)

    # Distribuzione greedy
    if strategy == "cap":
        _distribute_cap(plan, candidates, target_min_per_day, available)
    else:
        _distribute_spread(plan, candidates, available)

    # Persistenza opzionale
    created_ids: list[int] = []
    if not dry_run:
        if collision_strategy == "replace" and total_existing > 0:
            _delete_week_slots(db, days)
        for dp in plan:
            for cand in dp.articles:
                slot = EditorialSlot(
                    article_id=cand.article_id,
                    scheduled_for=dp.scheduled_for,
                    timezone=timezone,
                    created_by=creator_id,
                )
                db.add(slot)
                db.flush()  # to get slot.id

                article = db.query(Article).filter(Article.id == cand.article_id).first()
                if article and article.status == "approved":
                    article.status = "scheduled"
                created_ids.append(slot.id)
        db.commit()

    planned_count = sum(len(dp.articles) for dp in plan)
    total_min = sum(dp.total_reading_min for dp in plan)
    days_filled = sum(1 for dp in plan if dp.articles)
    avg_per_day = round(total_min / WEEK_DAYS, 1)

    warning = None
    if collision_detected:
        if collision_strategy == "integrate":
            warning = (
                f"Trovati {total_existing} slot già esistenti nella settimana: "
                "il nuovo piano si aggiunge negli spazi liberi."
            )
        elif collision_strategy == "replace":
            warning = (
                f"Cancellati {total_existing} slot pre-esistenti per ripianificare la settimana."
                if not dry_run
                else f"In conferma verranno cancellati {total_existing} slot pre-esistenti."
            )

    return AutoPlanResult(
        week_start=week_start,
        week_end=week_end,
        category=category,
        target_min_per_day=target_min_per_day,
        strategy=strategy,
        days=plan,
        summary=AutoPlanSummary(
            pool_size=len(candidates),
            articles_planned=planned_count,
            articles_unscheduled=len(candidates) - planned_count,
            total_reading_min=total_min,
            avg_reading_min_per_day=avg_per_day,
            days_filled=days_filled,
            collision_detected=collision_detected,
            existing_slots_in_week=total_existing,
            warning=warning,
            error=None,
        ),
        created_slot_ids=created_ids,
    )


# ---------------------------------------------------------------------------
# Distribution strategies
# ---------------------------------------------------------------------------


def _distribute_cap(
    plan: list[DayPlan],
    candidates: list[CandidateArticle],
    target_min: int,
    available_slots: dict[date, int],
) -> None:
    """Riempi finché total_reading_min < target su ogni giorno; non superarlo.

    Per ogni candidato cerca il giorno meno carico tra quelli che:
    1. hanno ancora slot disponibili
    2. non sforerebbero il target con questo articolo

    Se nessun giorno è valido, l'articolo resta unscheduled.
    """
    for cand in candidates:
        chosen: DayPlan | None = None
        for dp in plan:
            if available_slots[dp.date] <= 0:
                continue
            if dp.total_reading_min + cand.reading_time_min > target_min:
                continue
            if chosen is None or dp.total_reading_min < chosen.total_reading_min:
                chosen = dp
        if chosen is not None:
            chosen.articles.append(cand)
            chosen.total_reading_min += cand.reading_time_min
            available_slots[chosen.date] -= 1


def _distribute_spread(
    plan: list[DayPlan],
    candidates: list[CandidateArticle],
    available_slots: dict[date, int],
) -> None:
    """Spalmi tutti i candidati in modo bilanciato, ignorando il target.

    Per ogni candidato sceglie il giorno meno carico (in minuti) con slot.
    Si ferma solo se tutti i giorni sono pieni rispetto a max_per_day.
    """
    for cand in candidates:
        chosen: DayPlan | None = None
        for dp in plan:
            if available_slots[dp.date] <= 0:
                continue
            if chosen is None or dp.total_reading_min < chosen.total_reading_min:
                chosen = dp
        if chosen is None:
            break  # tutti i giorni pieni
        chosen.articles.append(cand)
        chosen.total_reading_min += cand.reading_time_min
        available_slots[chosen.date] -= 1


# ---------------------------------------------------------------------------
# DB queries
# ---------------------------------------------------------------------------


def _approved_candidates_in_category(db: Session, category: str) -> list[Article]:
    """Articoli `status='approved'` legati a un prompt nella macrocategoria.

    Stesso pattern del filtro Inbox in articles.py: 3-level folder hierarchy
    article → prompt → folder leaf → folder sub → folder cat.name = category.
    """
    f_leaf = aliased(PromptFolder)
    f_sub = aliased(PromptFolder)
    f_cat = aliased(PromptFolder)

    sub = (
        select(article_prompts.c.article_id)
        .select_from(article_prompts)
        .join(Prompt, Prompt.id == article_prompts.c.prompt_id)
        .join(f_leaf, f_leaf.id == Prompt.folder_id)
        .join(f_sub, f_sub.id == f_leaf.parent_id)
        .join(f_cat, f_cat.id == f_sub.parent_id)
        .where(f_cat.name == category)
    )

    return db.query(Article).filter(Article.status == "approved").filter(Article.id.in_(sub)).all()


def _existing_slots_by_day(
    db: Session, days: list[date], tz: ZoneInfo
) -> dict[date, list[ExistingSlotInfo]]:
    """Mappa date → slot già presenti (per gestione collisione + UI preview)."""
    if not days:
        return {}
    start_dt = datetime.combine(days[0], time.min, tzinfo=tz)
    end_dt = datetime.combine(days[-1], time.max, tzinfo=tz)
    rows = (
        db.query(EditorialSlot)
        .filter(EditorialSlot.scheduled_for >= start_dt)
        .filter(EditorialSlot.scheduled_for <= end_dt)
        .all()
    )
    out: dict[date, list[ExistingSlotInfo]] = {d: [] for d in days}
    title_by_id: dict[int, str] = {}
    article_ids = [r.article_id for r in rows if r.article_id]
    if article_ids:
        for a in db.query(Article).filter(Article.id.in_(article_ids)).all():
            title_by_id[a.id] = a.title
    for r in rows:
        # Normalizza in TZ per scegliere il giorno locale corretto (slot di
        # mezzanotte UTC potrebbe finire nel giorno precedente in Europe/Rome).
        local_dt = r.scheduled_for.astimezone(tz) if r.scheduled_for.tzinfo else r.scheduled_for
        d = local_dt.date()
        if d in out:
            out[d].append(
                ExistingSlotInfo(
                    slot_id=r.id,
                    article_id=r.article_id,
                    article_title=title_by_id.get(r.article_id) if r.article_id else None,
                    scheduled_for=r.scheduled_for,
                )
            )
    return out


def _get_max_posts_per_day(db: Session) -> int:
    rule = (
        db.query(CalendarRule)
        .filter(CalendarRule.rule_type == "max_posts_per_day", CalendarRule.is_active)
        .first()
    )
    return rule.value if rule else DEFAULT_MAX_POSTS_PER_DAY


def _delete_week_slots(db: Session, days: list[date]) -> None:
    """Cancella tutti gli slot dei giorni specificati e rimette gli articoli a `approved`."""
    if not days:
        return
    # Usiamo Europe/Rome come reference per la window (consistente con _existing_slots_by_day)
    tz = ZoneInfo("Europe/Rome")
    start_dt = datetime.combine(days[0], time.min, tzinfo=tz)
    end_dt = datetime.combine(days[-1], time.max, tzinfo=tz)
    slots = (
        db.query(EditorialSlot)
        .filter(EditorialSlot.scheduled_for >= start_dt)
        .filter(EditorialSlot.scheduled_for <= end_dt)
        .all()
    )
    affected_article_ids = [s.article_id for s in slots if s.article_id]
    for s in slots:
        db.delete(s)
    if affected_article_ids:
        for a in (
            db.query(Article)
            .filter(Article.id.in_(affected_article_ids))
            .filter(Article.status == "scheduled")
            .all()
        ):
            a.status = "approved"
    # Niente commit qui: il chiamante decide (gestione transazione unitaria).
