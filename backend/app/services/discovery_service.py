import logging
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.prompt import Prompt
from app.models.search import SearchRun, SearchResult
from app.models.article import Article, article_prompts
from app.models.blacklist import BlockedDomain
from app.models.logs import JobLog
from app.utils.url_utils import normalize_url, extract_domain
from app.utils.text_utils import compute_content_hash
from app.utils.html_utils import sanitize_html
from app.services.scraper_service import scrape_url
from app.services.ai_service import score_article

logger = logging.getLogger(__name__)


def run_discovery_pipeline(prompt_id: int, user_id: int | None = None):
    db = SessionLocal()
    try:
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            logger.error(f"Prompt {prompt_id} not found")
            return

        search_run = SearchRun(
            prompt_id=prompt_id,
            triggered_by=user_id,
            status="running",
        )
        db.add(search_run)
        db.commit()
        db.refresh(search_run)

        job_log = JobLog(
            job_type="discovery",
            entity_ref=f"prompt:{prompt_id}",
            status="running",
        )
        db.add(job_log)
        db.commit()

        blocked_domains = {bd.domain for bd in db.query(BlockedDomain).all()}

        results = []
        try:
            results = _search_duckduckgo(prompt)
        except Exception as e:
            logger.warning(f"DuckDuckGo search failed: {e}")

        search_run.urls_found = len(results)
        articles_created = 0
        duplicates_skipped = 0
        errors_count = 0

        for result in results:
            try:
                url = normalize_url(result.get("href", result.get("url", "")))
                domain = extract_domain(url)

                if domain in blocked_domains:
                    continue

                search_result = SearchResult(
                    search_run_id=search_run.id,
                    url=url,
                    title=result.get("title"),
                    snippet=result.get("body", result.get("snippet")),
                    provider="serp",
                    domain=domain,
                )
                db.add(search_result)

                existing = db.query(Article).filter(Article.canonical_url == url).first()
                if existing:
                    search_result.article_id = existing.id
                    db.execute(
                        article_prompts.insert().values(article_id=existing.id, prompt_id=prompt_id).prefix_with("OR IGNORE")
                    )
                    duplicates_skipped += 1
                    continue

                scraped = scrape_url(url)
                if not scraped or not scraped.get("text"):
                    errors_count += 1
                    continue

                content_hash = compute_content_hash(scraped["text"])
                hash_duplicate = db.query(Article).filter(Article.content_hash == content_hash).first()
                if hash_duplicate:
                    duplicates_skipped += 1
                    continue

                article_title = scraped.get("title") or result.get("title") or "Untitled"
                article = Article(
                    canonical_url=url,
                    source_domain=domain,
                    title=article_title,
                    author=scraped.get("author"),
                    published_at=scraped.get("date"),
                    language=prompt.language or "en",
                    country=prompt.countries[0] if prompt.countries else None,
                    content_html=sanitize_html(scraped.get("html", "")),
                    content_text=scraped["text"],
                    content_hash=content_hash,
                    featured_image_url=scraped.get("image"),
                    status="imported",
                )
                db.add(article)
                db.flush()

                search_result.article_id = article.id
                db.execute(
                    article_prompts.insert().values(article_id=article.id, prompt_id=prompt_id)
                )

                try:
                    prompt_text = prompt.description or " ".join(prompt.keywords)
                    ai_result = score_article(scraped["text"], prompt_text, prompt.keywords)
                    article.ai_score = ai_result.get("score", 0)
                    article.ai_score_explanation = ai_result.get("explanation", [])
                    article.ai_suggested_tags = ai_result.get("tags", [])
                    article.ai_suggested_category = ai_result.get("category")
                    article.ai_model_version = ai_result.get("model_version")
                except Exception as e:
                    logger.warning(f"AI scoring failed for {url}: {e}")

                articles_created += 1

            except Exception as e:
                logger.error(f"Error processing result: {e}")
                db.rollback()
                errors_count += 1

        search_run.articles_created = articles_created
        search_run.duplicates_skipped = duplicates_skipped
        search_run.errors_count = errors_count
        search_run.status = "completed"
        search_run.ended_at = datetime.now(timezone.utc)

        job_log.status = "completed"
        job_log.ended_at = datetime.now(timezone.utc)

        db.commit()

    except Exception as e:
        logger.error(f"Discovery pipeline failed: {e}")
        try:
            search_run.status = "failed"
            search_run.error_message = str(e)
            search_run.ended_at = datetime.now(timezone.utc)
            job_log.status = "failed"
            job_log.error = str(e)
            job_log.ended_at = datetime.now(timezone.utc)
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _search_duckduckgo(prompt: Prompt) -> list:
    from ddgs import DDGS

    # Use the natural-language description as query, fall back to keywords
    if prompt.description:
        query = prompt.description
    else:
        query = " ".join(prompt.keywords)
    if prompt.excluded_keywords:
        query += " " + " ".join(f"-{kw}" for kw in prompt.excluded_keywords)

    time_map = {"24h": "d", "7d": "w", "30d": "m", "90d": "m"}
    timelimit = time_map.get(prompt.time_depth, "w")

    region = None
    if prompt.countries:
        country_region_map = {"IT": "it-it", "US": "us-en", "UK": "uk-en", "FR": "fr-fr", "DE": "de-de", "ES": "es-es"}
        region = country_region_map.get(prompt.countries[0])

    results = list(DDGS().text(
        query,
        region=region or "wt-wt",
        timelimit=timelimit,
        max_results=prompt.max_results,
    ))
    return results
