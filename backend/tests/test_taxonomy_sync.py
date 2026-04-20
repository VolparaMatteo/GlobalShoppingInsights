"""Test del servizio di sincronizzazione bidirezionale taxonomy (WP ↔ GSI).

Mock di `_wp_client` via `monkeypatch` per restituire un `httpx.Client` con
`MockTransport` — così controlliamo precisamente cosa ritorna il "WordPress".
"""

from __future__ import annotations

import httpx
import pytest


@pytest.fixture
def wp_config(db):
    """Config WP minima necessaria perché _get_wp_config non sollevi."""
    from app.models.wordpress import WPConfig

    cfg = WPConfig(
        id=1,
        wp_url="https://wp.example.com",
        wp_username="user",
        wp_app_password_encrypted="pwd",
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg


def _mock_client_factory(handler):
    """Ritorna una factory `_wp_client(config)` che usa MockTransport."""

    def _factory(config):
        return httpx.Client(
            base_url=config.wp_url.rstrip("/") + "/wp-json/wp/v2",
            auth=("user", "pwd"),
            transport=httpx.MockTransport(handler),
            timeout=5,
        )

    return _factory


def test_sync_pulls_wp_tags_into_db(monkeypatch, db, wp_config):
    """WP ha 2 tag, locale vuoto → 2 tag importati."""
    from app.models.taxonomy import Tag
    from app.services import taxonomy_sync_service

    wp_tags = [
        {"id": 10, "name": "Retail", "slug": "retail"},
        {"id": 11, "name": "E-commerce", "slug": "e-commerce"},
    ]

    def handler(req):
        if req.url.path.endswith("/tags") and req.method == "GET":
            return httpx.Response(200, json=wp_tags, headers={"X-WP-TotalPages": "1"})
        if req.url.path.endswith("/categories") and req.method == "GET":
            return httpx.Response(200, json=[], headers={"X-WP-TotalPages": "1"})
        return httpx.Response(404)

    monkeypatch.setattr(taxonomy_sync_service, "_wp_client", _mock_client_factory(handler))

    result = taxonomy_sync_service.sync_from_wordpress(db)
    assert result["tags"]["pulled"] == 2
    assert result["tags"]["errors"] == 0

    tags = db.query(Tag).order_by(Tag.slug).all()
    assert [t.slug for t in tags] == ["e-commerce", "retail"]
    assert {t.wp_id for t in tags} == {10, 11}


def test_sync_pushes_local_only_tags_to_wp(monkeypatch, db, wp_config):
    """Tag locali con wp_id=NULL vengono creati su WP."""
    from app.models.taxonomy import Tag
    from app.services import taxonomy_sync_service

    db.add(Tag(name="Local Tag", slug="local-tag"))
    db.commit()

    posted = []

    def handler(req):
        if req.method == "GET" and req.url.path.endswith("/tags"):
            return httpx.Response(200, json=[], headers={"X-WP-TotalPages": "1"})
        if req.method == "GET" and req.url.path.endswith("/categories"):
            return httpx.Response(200, json=[], headers={"X-WP-TotalPages": "1"})
        if req.method == "POST" and req.url.path.endswith("/tags"):
            import json as _json

            body = _json.loads(req.content)
            posted.append(body)
            return httpx.Response(200, json={"id": 42, **body})
        return httpx.Response(404)

    monkeypatch.setattr(taxonomy_sync_service, "_wp_client", _mock_client_factory(handler))

    result = taxonomy_sync_service.sync_from_wordpress(db)
    assert result["tags"]["pushed"] == 1
    assert posted == [{"name": "Local Tag", "slug": "local-tag"}]

    db.expire_all()
    local_tag = db.query(Tag).filter(Tag.slug == "local-tag").first()
    assert local_tag.wp_id == 42


def test_sync_removes_orphan_tags(monkeypatch, db, wp_config):
    """Tag locale con wp_id non più presente in WP viene rimosso."""
    from app.models.taxonomy import Tag
    from app.services import taxonomy_sync_service

    db.add(Tag(name="Orphan", slug="orphan", wp_id=999))
    db.add(Tag(name="Still", slug="still", wp_id=1))
    db.commit()

    def handler(req):
        if req.method == "GET" and req.url.path.endswith("/tags"):
            return httpx.Response(
                200,
                json=[{"id": 1, "name": "Still", "slug": "still"}],
                headers={"X-WP-TotalPages": "1"},
            )
        if req.method == "GET" and req.url.path.endswith("/categories"):
            return httpx.Response(200, json=[], headers={"X-WP-TotalPages": "1"})
        return httpx.Response(404)

    monkeypatch.setattr(taxonomy_sync_service, "_wp_client", _mock_client_factory(handler))

    result = taxonomy_sync_service.sync_from_wordpress(db)
    assert result["tags"]["removed"] == 1
    assert result["tags"]["pulled"] == 1

    db.expire_all()
    slugs = {t.slug for t in db.query(Tag).all()}
    assert slugs == {"still"}  # orphan eliminato


def test_sync_error_on_tags_does_not_crash(monkeypatch, db, wp_config):
    """Se il fetch tag fallisce, la sync conta l'errore e prosegue con categories."""
    from app.models.taxonomy import Category
    from app.services import taxonomy_sync_service

    def handler(req):
        if req.method == "GET" and req.url.path.endswith("/tags"):
            return httpx.Response(500)
        if req.method == "GET" and req.url.path.endswith("/categories"):
            return httpx.Response(
                200,
                json=[{"id": 1, "name": "News", "slug": "news", "parent": 0}],
                headers={"X-WP-TotalPages": "1"},
            )
        return httpx.Response(404)

    monkeypatch.setattr(taxonomy_sync_service, "_wp_client", _mock_client_factory(handler))

    result = taxonomy_sync_service.sync_from_wordpress(db)
    assert result["tags"]["errors"] >= 1
    assert result["categories"]["pulled"] == 1

    assert db.query(Category).filter(Category.slug == "news").first() is not None


def test_sync_links_category_parent(monkeypatch, db, wp_config):
    """Le categorie WP con parent vengono linkate dopo un doppio pass."""
    from app.models.taxonomy import Category
    from app.services import taxonomy_sync_service

    def handler(req):
        if req.method == "GET" and req.url.path.endswith("/tags"):
            return httpx.Response(200, json=[], headers={"X-WP-TotalPages": "1"})
        if req.method == "GET" and req.url.path.endswith("/categories"):
            return httpx.Response(
                200,
                json=[
                    {"id": 1, "name": "Parent", "slug": "parent", "parent": 0},
                    {"id": 2, "name": "Child", "slug": "child", "parent": 1},
                ],
                headers={"X-WP-TotalPages": "1"},
            )
        return httpx.Response(404)

    monkeypatch.setattr(taxonomy_sync_service, "_wp_client", _mock_client_factory(handler))

    taxonomy_sync_service.sync_from_wordpress(db)

    db.expire_all()
    parent = db.query(Category).filter(Category.slug == "parent").first()
    child = db.query(Category).filter(Category.slug == "child").first()
    assert parent is not None
    assert child is not None
    assert child.parent_id == parent.id
