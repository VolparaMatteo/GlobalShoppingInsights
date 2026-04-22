"""Verifica che ogni funzione _seed_* di seed.py sia idempotente."""

from __future__ import annotations

import seed


def test_seed_admin_is_idempotent(db) -> None:
    from app.models.user import User

    seed._seed_admin(db)
    seed._seed_admin(db)

    admins = db.query(User).filter(User.email.like("%gsi.local%")).all()
    assert len(admins) == 1


def test_seed_tags_is_idempotent(db) -> None:
    from app.models.taxonomy import Tag

    seed._seed_tags(db)
    first_count = db.query(Tag).count()
    assert first_count >= 6

    seed._seed_tags(db)
    assert db.query(Tag).count() == first_count


def test_seed_categories_is_idempotent(db) -> None:
    from app.models.taxonomy import Category

    seed._seed_categories(db)
    first_count = db.query(Category).count()
    assert first_count >= 4

    seed._seed_categories(db)
    assert db.query(Category).count() == first_count


def test_seed_calendar_rules_is_idempotent(db) -> None:
    from app.models.calendar import CalendarRule

    seed._seed_calendar_rules(db)
    first_count = db.query(CalendarRule).count()
    assert first_count == 2

    seed._seed_calendar_rules(db)
    assert db.query(CalendarRule).count() == first_count


def test_seed_wp_config_is_idempotent(db) -> None:
    from app.models.wordpress import WPConfig

    seed._seed_wp_config(db)
    seed._seed_wp_config(db)
    assert db.query(WPConfig).count() == 1


def test_seed_partial_existing_row_still_idempotent(db) -> None:
    """Se esiste già UN tag, il seed aggiunge solo i mancanti."""
    from app.models.taxonomy import Tag

    db.add(Tag(name="Retail", slug="retail"))  # slug uguale a uno dei default
    db.commit()
    before = db.query(Tag).count()

    seed._seed_tags(db)
    after = db.query(Tag).count()
    assert after == 6  # 6 default totali
    assert after - before == 5  # ne ha aggiunti 5, non 6
