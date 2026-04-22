"""Test di wordpress_service.publish_to_wordpress con httpx mockato."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest


@pytest.fixture
def patch_wp_session(monkeypatch):
    """Redireziona SessionLocal di wordpress_service al test engine."""
    from tests.conftest import TestingSessionLocal

    monkeypatch.setattr(
        "app.services.wordpress_service.SessionLocal",
        lambda: TestingSessionLocal(),
    )


def _seed_wp_config(db, **overrides):
    from app.models.wordpress import WPConfig
    from app.utils.encryption import encrypt

    defaults = {
        "id": 1,
        "wp_url": "https://wp.example.com",
        "wp_username": "user",
        "wp_app_password_encrypted": encrypt("wp-secret"),
    }
    defaults.update(overrides)
    cfg = WPConfig(**defaults)
    db.add(cfg)
    db.commit()
    return cfg


def _seed_article(db, **overrides):
    from app.models.article import Article

    defaults = {
        "canonical_url": "https://news.example.com/article",
        "source_domain": "news.example.com",
        "title": "My Article",
        "content_text": "Full article body content.",
        "language": "en",
        "status": "scheduled",
        "featured_image_url": None,  # evita il path di upload immagine
    }
    defaults.update(overrides)
    art = Article(**defaults)
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


def test_publish_success(monkeypatch, db, patch_wp_session):
    from app.models.article import Article
    from app.models.wordpress import WPPost
    from app.services.wordpress_service import publish_to_wordpress

    _seed_wp_config(db)
    article = _seed_article(db, status="publishing")
    article_id = article.id

    def fake_post(url, *, json=None, auth=None, timeout=None, **_):
        resp = MagicMock()
        resp.status_code = 201
        resp.raise_for_status = lambda: None
        resp.json = lambda: {"id": 42, "link": "https://wp.example.com/?p=42", "status": "publish"}
        return resp

    monkeypatch.setattr("app.services.wordpress_service.httpx.post", fake_post)

    publish_to_wordpress(article_id)

    db.expire_all()
    art = db.query(Article).filter(Article.id == article_id).first()
    assert art.status == "published"

    wp_post = db.query(WPPost).filter(WPPost.article_id == article_id).first()
    assert wp_post is not None
    assert wp_post.wp_post_id == 42
    assert wp_post.wp_url == "https://wp.example.com/?p=42"


def test_publish_without_wp_config_fails(monkeypatch, db, patch_wp_session):
    from app.models.article import Article
    from app.services.wordpress_service import publish_to_wordpress

    # Nessun seed di WPConfig → service deve rifiutare
    article = _seed_article(db, status="publishing")
    article_id = article.id

    publish_to_wordpress(article_id)

    db.expire_all()
    art = db.query(Article).filter(Article.id == article_id).first()
    assert art.status == "publish_failed"


def test_publish_http_error_marks_failed(monkeypatch, db, patch_wp_session):
    from app.models.article import Article
    from app.models.logs import JobLog
    from app.services.wordpress_service import publish_to_wordpress

    _seed_wp_config(db)
    article = _seed_article(db, status="publishing")
    article_id = article.id

    def failing_post(*_a, **_kw):
        raise RuntimeError("WP is down")

    monkeypatch.setattr("app.services.wordpress_service.httpx.post", failing_post)

    publish_to_wordpress(article_id)

    db.expire_all()
    art = db.query(Article).filter(Article.id == article_id).first()
    assert art.status == "publish_failed"

    jobs = db.query(JobLog).filter(JobLog.job_type == "publish").all()
    assert any(j.status == "failed" for j in jobs)


def test_publish_creates_editorial_slot(monkeypatch, db, patch_wp_session):
    from app.models.calendar import EditorialSlot
    from app.services.wordpress_service import publish_to_wordpress

    _seed_wp_config(db)
    article = _seed_article(db, status="publishing")
    article_id = article.id

    def fake_post(*_a, **_kw):
        resp = MagicMock()
        resp.raise_for_status = lambda: None
        resp.json = lambda: {"id": 100, "link": "https://wp/?p=100", "status": "publish"}
        return resp

    monkeypatch.setattr("app.services.wordpress_service.httpx.post", fake_post)

    publish_to_wordpress(article_id)

    db.expire_all()
    slot = db.query(EditorialSlot).filter(EditorialSlot.article_id == article_id).first()
    assert slot is not None
    assert slot.status == "published"


def test_publish_article_not_found_is_silent(monkeypatch, db, patch_wp_session):
    """Se article_id non esiste, publish_to_wordpress logga ma non crasha."""
    from app.services.wordpress_service import publish_to_wordpress

    _seed_wp_config(db)

    # Nessun raise
    publish_to_wordpress(article_id=99999)


def test_publish_decrypts_wp_password(monkeypatch, db, patch_wp_session):
    """La password WP cifrata deve essere decifrata prima dell'uso in httpx auth."""
    from app.services.wordpress_service import publish_to_wordpress

    _seed_wp_config(db)
    article = _seed_article(db, status="publishing")

    captured_auth = []

    def fake_post(*_a, auth=None, **_kw):
        captured_auth.append(auth)
        resp = MagicMock()
        resp.raise_for_status = lambda: None
        resp.json = lambda: {"id": 1, "link": "x", "status": "publish"}
        return resp

    monkeypatch.setattr("app.services.wordpress_service.httpx.post", fake_post)

    publish_to_wordpress(article.id)

    assert captured_auth, "httpx.post non è stato chiamato"
    assert captured_auth[0] == ("user", "wp-secret")  # password decifrata correttamente
