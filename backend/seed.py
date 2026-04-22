"""Seed del database con admin user + dati di default.

Script **idempotente**: può essere rieseguito più volte senza duplicare dati.
Ogni funzione `_seed_*` verifica con query mirate se l'elemento esiste già.

**Prerequisito**: lo schema DB deve essere stato applicato con Alembic.
```
alembic upgrade head
python seed.py
```
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, engine
from app.models import CalendarRule, Category, Tag, User, WPConfig
from app.utils.admin_seed import resolve_admin_password
from app.utils.security import hash_password


def _check_schema_ready() -> None:
    """Fail-fast se Alembic non è ancora stato eseguito."""
    inspector = inspect(engine)
    if "alembic_version" not in inspector.get_table_names():
        sys.stderr.write(
            "ERROR: schema DB non inizializzato.\nEsegui prima:  alembic upgrade head\n",
        )
        sys.exit(1)


def _seed_admin(db: Session) -> None:
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if admin:
        print(f"Admin user already exists: {settings.ADMIN_EMAIL}")
        return
    password, was_generated = resolve_admin_password()
    admin = User(
        email=settings.ADMIN_EMAIL,
        name="Admin",
        password_hash=hash_password(password),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print(f"Admin user created: {settings.ADMIN_EMAIL}")
    if was_generated:
        _print_generated_admin_password(password)


def _seed_calendar_rules(db: Session) -> None:
    defaults = [
        ("max_posts_per_day", 5),
        ("min_hours_between_posts", 2),
    ]
    created = 0
    for rule_type, value in defaults:
        if db.query(CalendarRule).filter(CalendarRule.rule_type == rule_type).first():
            continue
        db.add(CalendarRule(rule_type=rule_type, value=value, is_active=True))
        created += 1
    if created:
        db.commit()
        print(f"Create {created} calendar rule di default")


def _seed_tags(db: Session) -> None:
    defaults = [
        ("E-commerce", "e-commerce"),
        ("Retail", "retail"),
        ("Technology", "technology"),
        ("Consumer Trends", "consumer-trends"),
        ("Sustainability", "sustainability"),
        ("Logistics", "logistics"),
    ]
    created = 0
    for name, slug in defaults:
        if db.query(Tag).filter(Tag.slug == slug).first():
            continue
        db.add(Tag(name=name, slug=slug))
        created += 1
    if created:
        db.commit()
        print(f"Creati {created} tag di default")


def _seed_categories(db: Session) -> None:
    defaults = [
        ("News", "news"),
        ("Analysis", "analysis"),
        ("Trends", "trends"),
        ("Technology", "tech"),
    ]
    created = 0
    for name, slug in defaults:
        if db.query(Category).filter(Category.slug == slug).first():
            continue
        db.add(Category(name=name, slug=slug))
        created += 1
    if created:
        db.commit()
        print(f"Create {created} categorie di default")


def _seed_wp_config(db: Session) -> None:
    if db.query(WPConfig).filter(WPConfig.id == 1).first():
        return
    db.add(WPConfig(id=1))
    db.commit()
    print("WP config singleton created")


def _print_generated_admin_password(password: str) -> None:
    banner = "=" * 72
    print(banner)
    print("  ADMIN_PASSWORD non impostata in .env — password generata randomicamente:")
    print()
    print(f"    {password}")
    print()
    print("  Salvala ORA: non verrà più mostrata.")
    print("  Per re-seedare con una password scelta, impostala in .env (ADMIN_PASSWORD).")
    print(banner)


def seed() -> None:
    _check_schema_ready()
    db = SessionLocal()
    try:
        _seed_admin(db)
        _seed_calendar_rules(db)
        _seed_tags(db)
        _seed_categories(db)
        _seed_wp_config(db)
        print("Seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
