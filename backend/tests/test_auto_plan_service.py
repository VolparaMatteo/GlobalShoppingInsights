"""Test del servizio auto_plan (generate_auto_plan).

Setup minimo: crea la gerarchia 3-livelli folder (cat → sub → leaf), un prompt
in `leaf`, e link M:M articoli↔prompt. Gli articoli stessi sono creati con
title/content_text (per il reading_time) e ai_score (per l'ordering).
"""

from __future__ import annotations

from datetime import date, time, timedelta

import pytest

from app.models.article import Article, article_prompts
from app.models.calendar import CalendarRule, EditorialSlot
from app.models.prompt import Prompt
from app.models.prompt_folder import PromptFolder
from app.services.auto_plan_service import generate_auto_plan

# ---------------------------------------------------------------------------
# Fixtures locali
# ---------------------------------------------------------------------------


@pytest.fixture
def category_setup(db):
    """Crea cat → sub → leaf per la macrocategoria 'STRATEGY' + 1 prompt."""
    cat = PromptFolder(name="STRATEGY", parent_id=None)
    db.add(cat)
    db.flush()
    sub = PromptFolder(name="Pricing", parent_id=cat.id)
    db.add(sub)
    db.flush()
    leaf = PromptFolder(name="Pricing-2026", parent_id=sub.id)
    db.add(leaf)
    db.flush()
    p = Prompt(title="Strategy prompt", folder_id=leaf.id, keywords=["pricing"])
    db.add(p)
    db.commit()
    return {"cat": cat, "sub": sub, "leaf": leaf, "prompt": p}


def _make_approved_article(db, prompt, *, title, words: int, score: int) -> Article:
    """Articolo approved nella categoria, con `words` parole di content_text."""
    text = ("parola " * words).strip()
    art = Article(
        canonical_url=f"https://example.com/{title.lower().replace(' ', '-')}-{score}",
        source_domain="example.com",
        title=title,
        language="it",
        status="approved",
        content_text=text,
        ai_score=score,
    )
    db.add(art)
    db.flush()
    db.execute(article_prompts.insert().values(article_id=art.id, prompt_id=prompt.id))
    db.commit()
    return art


# ---------------------------------------------------------------------------
# Setup base + spread strategy
# ---------------------------------------------------------------------------


def test_pool_filters_only_approved_in_category(db, category_setup):
    p = category_setup["prompt"]
    _make_approved_article(db, p, title="A", words=200, score=80)  # approved → in pool
    # Articolo nella stessa categoria ma scheduled → fuori pool
    art2 = _make_approved_article(db, p, title="B", words=200, score=70)
    art2.status = "scheduled"
    # Articolo approved ma in altra categoria → fuori pool
    other_cat = PromptFolder(name="OTHER", parent_id=None)
    db.add(other_cat)
    db.flush()
    other_sub = PromptFolder(name="OS", parent_id=other_cat.id)
    db.add(other_sub)
    db.flush()
    other_leaf = PromptFolder(name="OL", parent_id=other_sub.id)
    db.add(other_leaf)
    other_prompt = Prompt(title="Other", folder_id=other_leaf.id, keywords=["x"])
    db.add(other_prompt)
    db.commit()
    _make_approved_article(db, other_prompt, title="C", words=200, score=90)

    db.commit()

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=15,
        strategy="spread",
    )
    assert result.summary.pool_size == 1
    assert result.days[0].articles[0].title == "A"


def test_spread_distributes_all_available(db, category_setup):
    """Spread mode usa tutto il pool (rispettando max_per_day)."""
    p = category_setup["prompt"]
    for i in range(10):
        _make_approved_article(db, p, title=f"Art {i}", words=400, score=90 - i)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=5,  # ignored in spread
        strategy="spread",
    )
    # Tutti i 10 articoli pianificati (max 7 giorni × 10 max = 70 slot OK)
    assert result.summary.pool_size == 10
    assert result.summary.articles_planned == 10
    # Distribuzione bilanciata: 7 giorni × 1 + 3 giorni × 1 in più = quasi uguale
    counts = sorted(len(d.articles) for d in result.days)
    assert max(counts) - min(counts) <= 1


def test_cap_respects_target_per_day(db, category_setup):
    """Cap mode: non supera target. 400 parole = 2 min per articolo."""
    p = category_setup["prompt"]
    for i in range(20):
        _make_approved_article(db, p, title=f"Art {i}", words=400, score=90)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=5,  # ~2 articoli da 2 min ciascuno per giorno
        strategy="cap",
    )
    # Ogni giorno: max 2 articoli (4 min totali, prossimo sforerebbe 6 > 5)
    for dp in result.days:
        assert dp.total_reading_min <= 5
        assert len(dp.articles) <= 2


def test_ordering_by_ai_score_desc(db, category_setup):
    """Articoli con score più alto vengono pianificati per primi."""
    p = category_setup["prompt"]
    _make_approved_article(db, p, title="Low", words=200, score=10)
    _make_approved_article(db, p, title="High", words=200, score=99)
    _make_approved_article(db, p, title="Mid", words=200, score=50)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=10,
        strategy="spread",
    )
    # Lunedì pianifica per primo (round-robin) → "High" deve essere lì
    assert result.days[0].articles[0].title == "High"


# ---------------------------------------------------------------------------
# max_posts_per_day
# ---------------------------------------------------------------------------


def test_max_posts_per_day_rule_is_respected(db, category_setup):
    """CalendarRule max_posts_per_day=2 → max 2 slot/giorno."""
    db.add(CalendarRule(rule_type="max_posts_per_day", value=2, is_active=True))
    db.commit()

    p = category_setup["prompt"]
    for i in range(20):
        _make_approved_article(db, p, title=f"Art {i}", words=200, score=90 - i)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=100,  # alto — non è il limit
        strategy="spread",
    )
    for dp in result.days:
        assert len(dp.articles) <= 2
    # 7 giorni × 2 = 14 totali, 20 disponibili → 6 unscheduled
    assert result.summary.articles_planned == 14
    assert result.summary.articles_unscheduled == 6


# ---------------------------------------------------------------------------
# Persistenza (dry_run=False)
# ---------------------------------------------------------------------------


def test_dry_run_does_not_persist(db, category_setup):
    p = category_setup["prompt"]
    _make_approved_article(db, p, title="A", words=200, score=80)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=10,
        strategy="spread",
        dry_run=True,
    )
    assert result.summary.articles_planned == 1
    assert result.created_slot_ids == []
    assert db.query(EditorialSlot).count() == 0


def test_persist_creates_slots_and_transitions_status(db, category_setup, admin_user):
    p = category_setup["prompt"]
    art = _make_approved_article(db, p, title="A", words=200, score=80)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=10,
        strategy="spread",
        dry_run=False,
        creator_id=admin_user.id,
    )
    assert len(result.created_slot_ids) == 1
    db.expire_all()  # forza reload da DB dopo commit interno al servizio
    refreshed = db.query(Article).filter(Article.id == art.id).first()
    assert refreshed.status == "scheduled"
    assert db.query(EditorialSlot).count() == 1


# ---------------------------------------------------------------------------
# Collisioni
# ---------------------------------------------------------------------------


def _create_existing_slot_in_week(db, week_start: date, day_offset: int = 0):
    from datetime import datetime
    from zoneinfo import ZoneInfo

    when = datetime.combine(
        week_start + timedelta(days=day_offset),
        time(9, 0),
        tzinfo=ZoneInfo("Europe/Rome"),
    )
    slot = EditorialSlot(article_id=None, scheduled_for=when, timezone="Europe/Rome")
    db.add(slot)
    db.commit()
    return slot


def test_collision_fail_raises_when_week_busy(db, category_setup):
    week = date(2026, 5, 11)
    _create_existing_slot_in_week(db, week)
    p = category_setup["prompt"]
    _make_approved_article(db, p, title="A", words=200, score=80)

    with pytest.raises(ValueError, match="già occupata"):
        generate_auto_plan(
            db,
            category="STRATEGY",
            week_start=week,
            publish_time=time(9, 0),
            target_min_per_day=10,
            strategy="spread",
            collision_strategy="fail",
        )


def test_collision_integrate_keeps_existing(db, category_setup):
    """Default 'integrate': lo slot esistente viene riportato in preview, non cancellato."""
    db.add(CalendarRule(rule_type="max_posts_per_day", value=2, is_active=True))
    db.commit()
    week = date(2026, 5, 11)
    _create_existing_slot_in_week(db, week, day_offset=0)
    p = category_setup["prompt"]
    for i in range(5):
        _make_approved_article(db, p, title=f"Art {i}", words=200, score=90 - i)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=week,
        publish_time=time(9, 0),
        target_min_per_day=10,
        strategy="spread",
        collision_strategy="integrate",
    )
    # Lunedì ha già 1 slot (existing) → max 2 → solo 1 nuovo articolo
    monday = result.days[0]
    assert len(monday.existing_slots) == 1
    assert len(monday.articles) == 1
    assert result.summary.collision_detected
    assert result.summary.warning is not None


def test_collision_replace_deletes_existing_when_persisted(db, category_setup, admin_user):
    week = date(2026, 5, 11)
    existing = _create_existing_slot_in_week(db, week, day_offset=0)
    p = category_setup["prompt"]
    _make_approved_article(db, p, title="A", words=200, score=80)

    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=week,
        publish_time=time(9, 0),
        target_min_per_day=10,
        strategy="spread",
        collision_strategy="replace",
        dry_run=False,
        creator_id=admin_user.id,
    )
    db.expire_all()
    # Slot esistente cancellato + 1 nuovo creato
    assert db.query(EditorialSlot).filter(EditorialSlot.id == existing.id).first() is None
    assert len(result.created_slot_ids) == 1


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def test_target_must_be_positive(db, category_setup):
    with pytest.raises(ValueError, match="target_min_per_day"):
        generate_auto_plan(
            db,
            category="STRATEGY",
            week_start=date(2026, 5, 11),
            publish_time=time(9, 0),
            target_min_per_day=0,
            strategy="spread",
        )


def test_empty_pool_returns_empty_plan(db, category_setup):
    """Categoria valida ma nessun articolo approved → piano vuoto, niente errore."""
    result = generate_auto_plan(
        db,
        category="STRATEGY",
        week_start=date(2026, 5, 11),
        publish_time=time(9, 0),
        target_min_per_day=15,
        strategy="spread",
    )
    assert result.summary.pool_size == 0
    assert result.summary.articles_planned == 0
    for dp in result.days:
        assert dp.articles == []
