"""Pytest fixtures condivise per il backend GSI."""

from __future__ import annotations

import os
import uuid

# Forza ENV=test prima che qualunque import di `app.config` lo legga dal .env.
# Deve stare QUI in cima: disabilita i validator di produzione anche se
# l'utente ha ENV=production nella sua shell. Gli import successivi attivano
# `Settings()` a module-level.
os.environ["ENV"] = "test"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.utils.security import hash_password  # noqa: E402

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    user = User(
        email="admin@test.com",
        name="Test Admin",
        password_hash=hash_password("testpass123"),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "testpass123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ----------------------------------------------------------------------------
# Helper fixtures per test multi-role / multi-entità (Sprint 3+).
# ----------------------------------------------------------------------------


@pytest.fixture
def user_factory(db):
    """Factory per creare utenti di ruolo arbitrario.

    Uso:
        def test_x(client, user_factory, headers_for):
            user_factory(role="editor", email="ed@test.com")
            h = headers_for("ed@test.com")
            ...
    """

    def _make(
        role: str = "contributor",
        email: str | None = None,
        password: str = "testpass123",
        is_active: bool = True,
    ) -> User:
        if email is None:
            email = f"{role}-{uuid.uuid4().hex[:6]}@test.com"
        user = User(
            email=email,
            name=role.title(),
            password_hash=hash_password(password),
            role=role,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _make


@pytest.fixture
def headers_for(client):
    """Ritorna un dict di auth header effettuando login con le credenziali fornite."""

    def _h(email: str, password: str = "testpass123") -> dict[str, str]:
        r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _h


@pytest.fixture
def article_factory(db):
    """Factory per creare `Article` con default ragionevoli + override."""
    from app.models.article import Article

    def _make(status: str = "imported", **overrides) -> Article:
        defaults: dict = {
            "canonical_url": f"https://example.com/article-{uuid.uuid4().hex[:8]}",
            "source_domain": "example.com",
            "title": "Test Article",
            "language": "en",
            "status": status,
        }
        defaults.update(overrides)
        article = Article(**defaults)
        db.add(article)
        db.commit()
        db.refresh(article)
        return article

    return _make
