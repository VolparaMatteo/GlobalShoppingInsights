"""Seed the database with an admin user and sample data."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base, SessionLocal
from app.models import *
from app.utils.security import hash_password
from app.config import settings


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create admin user
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                name="Admin",
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"Admin user created: {settings.ADMIN_EMAIL}")
        else:
            print(f"Admin user already exists: {settings.ADMIN_EMAIL}")

        # Create default calendar rules
        if not db.query(CalendarRule).first():
            rules = [
                CalendarRule(rule_type="max_posts_per_day", value=5, is_active=True),
                CalendarRule(rule_type="min_hours_between_posts", value=2, is_active=True),
            ]
            db.add_all(rules)
            db.commit()
            print("Default calendar rules created")

        # Create sample tags
        if not db.query(Tag).first():
            tags = [
                Tag(name="E-commerce", slug="e-commerce"),
                Tag(name="Retail", slug="retail"),
                Tag(name="Technology", slug="technology"),
                Tag(name="Consumer Trends", slug="consumer-trends"),
                Tag(name="Sustainability", slug="sustainability"),
                Tag(name="Logistics", slug="logistics"),
            ]
            db.add_all(tags)
            db.commit()
            print("Sample tags created")

        # Create sample categories
        if not db.query(Category).first():
            categories = [
                Category(name="News", slug="news"),
                Category(name="Analysis", slug="analysis"),
                Category(name="Trends", slug="trends"),
                Category(name="Technology", slug="tech"),
            ]
            db.add_all(categories)
            db.commit()
            print("Sample categories created")

        # Create WP config singleton
        if not db.query(WPConfig).first():
            wp_config = WPConfig(id=1)
            db.add(wp_config)
            db.commit()
            print("WP config singleton created")

        print("Seeding complete!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
