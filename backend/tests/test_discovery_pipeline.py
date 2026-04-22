"""Test end-to-end della pipeline di discovery (DDGS / scraper / ai / llm mockati).

La pipeline `run_discovery_pipeline` apre una propria `SessionLocal()`. Qui la
reindirizziamo alla `TestingSessionLocal` del conftest via monkeypatch, così
le scritture della pipeline finiscono nel DB di test.

Dopo la chiamata a pipeline, facciamo `db.expire_all()` nella sessione di test
per re-leggere i dati committati dalla sessione interna della pipeline.

NOTA: questi test richiedono che `app.services.discovery_service` sia
importabile, il che a sua volta tira dentro `trafilatura` → `lxml`. Se il
sistema ha un policy di controllo applicazioni che blocca `lxml/etree.pyd`
(tipico su alcune macchine Windows enterprise) i test vengono SKIPPATI con
un messaggio chiaro. In CI (Linux) girano normalmente.
"""

from __future__ import annotations

import pytest

try:
    from app.services.discovery_service import run_discovery_pipeline  # noqa: F401
except Exception as _import_error:  # pragma: no cover — path dipende da env
    _IMPORT_ERROR: str | None = str(_import_error)
else:
    _IMPORT_ERROR = None

pytestmark = pytest.mark.skipif(
    _IMPORT_ERROR is not None,
    reason=f"discovery_service non importabile (policy/OS?): {_IMPORT_ERROR}",
)


@pytest.fixture
def patch_discovery_session(monkeypatch):
    """Sostituisce `SessionLocal` in discovery_service con il TestingSessionLocal."""
    from tests.conftest import TestingSessionLocal

    monkeypatch.setattr(
        "app.services.discovery_service.SessionLocal",
        lambda: TestingSessionLocal(),
    )


@pytest.fixture
def mock_discovery(monkeypatch):
    """Mock di DDGS, scrape_url, score_article, evaluate_relevance.

    Ritorna un oggetto `Controls` che il test può mutare prima di chiamare
    la pipeline per simulare vari scenari.
    """

    class Controls:
        search_results = [
            {"url": "https://news.example.com/a1", "title": "Article A", "body": "snippet"},
        ]
        scrape_result = {
            "text": "Retail news article with meaningful content for scoring.",
            "title": "Retail News Article",
            "author": "Jane Doe",
            "date": "2026-04-15",
            "language": "en",
            "html": "<p>HTML</p>",
            "image": None,
        }
        ai_result = {
            "score": 70,
            "explanation": ["good"],
            "tags": ["retail"],
            "category": "News",
            "model_version": "test-model",
        }
        llm_result = {"relevant": True, "score": 80, "comment": "Relevant", "confidence": 0.9}
        raise_on_llm = False
        raise_on_search = False
        calls = {"ddgs": 0, "scrape": 0, "ai": 0, "llm": 0}

    def _fake_search(prompt):
        Controls.calls["ddgs"] += 1
        if Controls.raise_on_search:
            raise RuntimeError("DDGS error")
        return [dict(r) for r in Controls.search_results]

    def _fake_scrape(url):
        Controls.calls["scrape"] += 1
        return dict(Controls.scrape_result)

    def _fake_score(text, prompt_text, keywords):
        Controls.calls["ai"] += 1
        return dict(Controls.ai_result)

    def _fake_llm(**kwargs):
        Controls.calls["llm"] += 1
        if Controls.raise_on_llm:
            raise RuntimeError("Ollama offline")
        return dict(Controls.llm_result)

    monkeypatch.setattr("app.services.discovery_service._search_duckduckgo", _fake_search)
    monkeypatch.setattr("app.services.discovery_service.scrape_url", _fake_scrape)
    monkeypatch.setattr("app.services.discovery_service.score_article", _fake_score)
    monkeypatch.setattr("app.services.discovery_service.evaluate_relevance", _fake_llm)

    return Controls


def _create_prompt(db, **overrides):
    from app.models.prompt import Prompt

    defaults = {
        "title": "Retail news",
        "keywords": ["retail"],
        "language": "en",
        "time_depth": "30d",
        "max_results": 20,
        "is_active": True,
    }
    defaults.update(overrides)
    prompt = Prompt(**defaults)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


# =============================================================================
# Happy path
# =============================================================================


def test_pipeline_happy_path_creates_article(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.article import Article
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run is not None
    assert run.status == "completed"
    assert run.urls_found == 1
    assert run.articles_created == 1
    assert run.duplicates_skipped == 0

    article = db.query(Article).filter(Article.canonical_url.like("%news.example.com%")).first()
    assert article is not None
    assert article.status == "imported"
    assert article.ai_score == 80  # LLM score prevale
    assert article.ai_relevance_comment == "Relevant"


# =============================================================================
# Deduplicazione
# =============================================================================


def test_skips_existing_url(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.article import Article
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    existing = Article(
        canonical_url="https://news.example.com/a1",
        source_domain="news.example.com",
        title="Existing",
        language="en",
        status="published",
    )
    db.add(existing)
    db.commit()

    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.duplicates_skipped == 1
    assert run.articles_created == 0
    assert db.query(Article).filter(Article.canonical_url.like("%news.example.com%")).count() == 1


def test_skips_duplicate_content_hash(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.article import Article
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline
    from app.utils.text_utils import compute_content_hash

    scrape_text = mock_discovery.scrape_result["text"]
    existing_hash = compute_content_hash(scrape_text)
    existing = Article(
        canonical_url="https://different-site.com/same-content",
        source_domain="different-site.com",
        title="Existing",
        language="en",
        status="published",
        content_hash=existing_hash,
    )
    db.add(existing)
    db.commit()

    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.duplicates_skipped == 1
    assert run.articles_created == 0


# =============================================================================
# Filtri
# =============================================================================


def test_language_filter_skips_foreign_article(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    mock_discovery.scrape_result["language"] = "it"  # articolo in italiano
    prompt = _create_prompt(db, language="en")  # vogliamo inglese
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.language_filtered == 1
    assert run.articles_created == 0


def test_low_embedding_score_filters_out(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    mock_discovery.ai_result["score"] = 10  # < MIN_RELEVANCE_SCORE (25)
    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.relevance_filtered == 1
    assert run.articles_created == 0


def test_llm_rejects_high_confidence(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    mock_discovery.llm_result = {
        "relevant": False,
        "score": 15,
        "comment": "Off-topic",
        "confidence": 0.95,
    }
    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.relevance_filtered == 1
    assert run.articles_created == 0


def test_llm_rejects_but_low_confidence_creates_anyway(
    db,
    patch_discovery_session,
    mock_discovery,
) -> None:
    """Se LLM dice no ma con confidence <= 0.85, l'articolo è comunque creato."""
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    mock_discovery.llm_result = {
        "relevant": False,
        "score": 40,
        "comment": "Borderline",
        "confidence": 0.5,
    }
    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.articles_created == 1
    assert run.relevance_filtered == 0


def test_llm_exception_falls_back_to_embedding(
    db,
    patch_discovery_session,
    mock_discovery,
) -> None:
    """Se evaluate_relevance raises, la pipeline prosegue con solo l'embedding score."""
    from app.models.article import Article
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    mock_discovery.raise_on_llm = True
    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.articles_created == 1

    article = db.query(Article).filter(Article.canonical_url.like("%news.example.com%")).first()
    assert article is not None
    assert article.ai_score == 70  # embedding score, LLM fallito
    assert article.ai_relevance_comment is None


# =============================================================================
# Blacklist
# =============================================================================


def test_blacklisted_domain_not_processed(db, patch_discovery_session, mock_discovery) -> None:
    from app.models.blacklist import BlockedDomain
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    db.add(BlockedDomain(domain="news.example.com", reason="spam"))
    db.commit()

    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.articles_created == 0
    assert run.urls_found == 1  # DDGS ha trovato, ma blacklist ha skippato


# =============================================================================
# DDGS failure
# =============================================================================


def test_search_failure_completes_run_with_zero(
    db,
    patch_discovery_session,
    mock_discovery,
) -> None:
    from app.models.search import SearchRun
    from app.services.discovery_service import run_discovery_pipeline

    mock_discovery.raise_on_search = True
    prompt = _create_prompt(db)
    prompt_id = prompt.id

    run_discovery_pipeline(prompt_id)

    db.expire_all()
    run = db.query(SearchRun).filter(SearchRun.prompt_id == prompt_id).first()
    assert run.status == "completed"
    assert run.urls_found == 0
    assert run.articles_created == 0
