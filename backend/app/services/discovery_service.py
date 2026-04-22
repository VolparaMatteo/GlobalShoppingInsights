import logging
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.article import Article, article_prompts
from app.models.blacklist import BlockedDomain
from app.models.logs import JobLog
from app.models.prompt import Prompt
from app.models.search import SearchResult, SearchRun
from app.services.ai_service import MIN_RELEVANCE_SCORE, score_article
from app.services.llm_service import OLLAMA_MODEL, evaluate_relevance
from app.services.scraper_service import scrape_url
from app.utils.html_utils import sanitize_html
from app.utils.text_utils import compute_content_hash
from app.utils.url_utils import extract_domain, normalize_url

logger = logging.getLogger(__name__)


def _parse_date(value) -> datetime | None:
    """Convert a date string (from trafilatura) to a datetime object."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    for fmt in (
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%B %d, %Y",
        "%b %d, %Y",
    ):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    logger.warning(f"Could not parse date: {value!r}")
    return None


# ---------------------------------------------------------------------------
# Time depth validation
# ---------------------------------------------------------------------------

_TIME_DEPTH_MAP = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
    "365d": timedelta(days=365),
}


def _is_within_time_depth(published_at: datetime | None, time_depth: str | None) -> bool | None:
    """Check if article date is within the prompt's time depth.

    Returns:
        True  – article is within range
        False – article is outside range (should be skipped)
        None  – date unknown (keep the article)
    """
    if not time_depth or time_depth not in _TIME_DEPTH_MAP:
        return True
    if published_at is None:
        return None

    allowed_delta = _TIME_DEPTH_MAP[time_depth]
    # +1 day grace period for timezone differences and indexing delays
    grace = timedelta(days=1)
    cutoff = datetime.now(timezone.utc) - allowed_delta - grace

    # Make published_at timezone-aware if it isn't
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)

    return published_at >= cutoff


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


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
        language_filtered = 0
        date_filtered = 0
        relevance_filtered = 0
        llm_filtered = 0

        for result in results:
            try:
                url = normalize_url(result.get("url", ""))
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
                        article_prompts.insert()
                        .values(article_id=existing.id, prompt_id=prompt_id)
                        .prefix_with("OR IGNORE")
                    )
                    duplicates_skipped += 1
                    continue

                scraped = scrape_url(url)
                if not scraped or not scraped.get("text"):
                    errors_count += 1
                    continue

                content_hash = compute_content_hash(scraped["text"])
                hash_duplicate = (
                    db.query(Article).filter(Article.content_hash == content_hash).first()
                )
                if hash_duplicate:
                    duplicates_skipped += 1
                    continue

                # --- Language filter (post-scraping) ---
                detected_lang = scraped.get("language")
                if prompt.language and detected_lang and detected_lang != prompt.language:
                    logger.info(
                        f"Language filter: skipping {url} (detected={detected_lang}, expected={prompt.language})"
                    )
                    language_filtered += 1
                    continue

                # Use detected language, fallback to prompt language
                article_language = detected_lang or prompt.language or "en"

                # --- Date filter (post-scraping) ---
                article_title = scraped.get("title") or result.get("title") or "Untitled"
                raw_date = scraped.get("date")
                published_at = _parse_date(raw_date)
                logger.info(f"Article date for {url}: raw={raw_date!r} parsed={published_at!r}")

                date_check = _is_within_time_depth(published_at, prompt.time_depth)
                if date_check is False:
                    logger.info(
                        f"Date filter: skipping {url} (published_at={published_at}, time_depth={prompt.time_depth})"
                    )
                    date_filtered += 1
                    continue

                # --- AI relevance check (BEFORE creating the article) ---
                # Score the full scraped text against the prompt to decide
                # whether this article is actually on-topic.
                prompt_text = prompt.description or " ".join(prompt.keywords)
                try:
                    ai_result = score_article(scraped["text"], prompt_text, prompt.keywords)
                except Exception as e:
                    logger.warning(f"AI scoring failed for {url}: {e}")
                    ai_result = {
                        "score": 0,
                        "explanation": [f"Scoring error: {e}"],
                        "tags": [],
                        "category": None,
                        "model_version": "error",
                    }

                ai_score = ai_result.get("score", 0)

                if ai_score < MIN_RELEVANCE_SCORE:
                    logger.info(
                        f"Relevance filter: skipping {url} (score={ai_score}, min={MIN_RELEVANCE_SCORE})"
                    )
                    relevance_filtered += 1
                    continue

                # --- LLM deep relevance check (second-level filter) ---
                llm_comment = None
                llm_score = None
                try:
                    llm_result = evaluate_relevance(
                        article_text=scraped["text"],
                        article_title=article_title,
                        prompt_description=prompt.description or " ".join(prompt.keywords),
                        prompt_keywords=prompt.keywords or [],
                        language=article_language,
                    )
                    logger.info(
                        f"LLM evaluation for {url}: "
                        f"relevant={llm_result['relevant']}, score={llm_result.get('score')}, "
                        f"confidence={llm_result['confidence']:.2f}, "
                        f"comment={llm_result.get('comment')}"
                    )
                    if not llm_result["relevant"] and llm_result["confidence"] > 0.85:
                        logger.info(f"LLM relevance filter: SKIPPING {url}")
                        relevance_filtered += 1
                        llm_filtered += 1
                        continue
                    llm_comment = llm_result.get("comment")
                    llm_score = llm_result.get("score")
                except Exception as e:
                    logger.warning(f"LLM evaluation failed for {url}: {e}")

                # Final score: use LLM score if available, fall back to embedding score
                final_score = llm_score if llm_score is not None else ai_score

                article = Article(
                    canonical_url=url,
                    source_domain=domain,
                    title=article_title,
                    author=scraped.get("author"),
                    published_at=published_at,
                    language=article_language,
                    country=prompt.countries[0] if prompt.countries else None,
                    content_html=sanitize_html(scraped.get("html", "")),
                    content_text=scraped["text"],
                    content_hash=content_hash,
                    featured_image_url=scraped.get("image") or result.get("image"),
                    status="imported",
                    ai_score=final_score,
                    ai_score_explanation=ai_result.get("explanation", []),
                    ai_suggested_tags=ai_result.get("tags", []),
                    ai_suggested_category=ai_result.get("category"),
                    ai_model_version=f"llm:{OLLAMA_MODEL}"
                    if llm_score is not None
                    else ai_result.get("model_version"),
                    ai_relevance_comment=llm_comment,
                )
                db.add(article)
                db.flush()

                search_result.article_id = article.id
                db.execute(
                    article_prompts.insert().values(article_id=article.id, prompt_id=prompt_id)
                )

                articles_created += 1

            except Exception as e:
                logger.error(f"Error processing result: {e}")
                db.rollback()
                errors_count += 1

        logger.info(
            f"Discovery pipeline completed for prompt {prompt_id}: "
            f"urls={len(results)}, created={articles_created}, "
            f"duplicates={duplicates_skipped}, errors={errors_count}, "
            f"lang_filtered={language_filtered}, date_filtered={date_filtered}, "
            f"embedding_filtered={relevance_filtered - llm_filtered}, "
            f"llm_filtered={llm_filtered}"
        )

        search_run.articles_created = articles_created
        search_run.duplicates_skipped = duplicates_skipped
        search_run.errors_count = errors_count
        search_run.language_filtered = language_filtered
        search_run.date_filtered = date_filtered
        search_run.relevance_filtered = relevance_filtered
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


# ---------------------------------------------------------------------------
# DuckDuckGo search: news() primary + text() fallback
# ---------------------------------------------------------------------------


def _search_duckduckgo(prompt: Prompt) -> list:
    from ddgs import DDGS

    time_map = {"24h": "d", "7d": "w", "30d": "m", "90d": "m", "365d": "y"}

    region = None
    if prompt.countries:
        country_region_map = {
            "IT": "it-it",
            "US": "us-en",
            "UK": "uk-en",
            "FR": "fr-fr",
            "DE": "de-de",
            "ES": "es-es",
        }
        region = country_region_map.get(prompt.countries[0])

    max_results = prompt.max_results
    timelimit = time_map.get(prompt.time_depth, "w")
    exclusions = (
        " ".join(f"-{kw}" for kw in prompt.excluded_keywords) if prompt.excluded_keywords else ""
    )

    # Build multiple queries for broader coverage
    queries = []
    if prompt.description:
        queries.append(prompt.description)
    if prompt.keywords:
        # All keywords together
        queries.append(" ".join(prompt.keywords))
        # Each keyword individually (if more than one)
        if len(prompt.keywords) > 1:
            for kw in prompt.keywords:
                queries.append(kw)

    # Deduplicate queries
    seen_queries = set()
    unique_queries = []
    for q in queries:
        normalized = q.strip().lower()
        if normalized not in seen_queries:
            seen_queries.add(normalized)
            unique_queries.append(q)

    if exclusions:
        unique_queries = [f"{q} {exclusions}" for q in unique_queries]

    logger.info(f"DuckDuckGo multi-query for prompt {prompt.id}: {len(unique_queries)} queries")

    # Results budget: split max_results across queries
    per_query = max(max_results // len(unique_queries), 10) if unique_queries else max_results

    results = []
    for query in unique_queries:
        # news() — primary source
        try:
            news_results = list(
                DDGS().news(
                    query,
                    region=region or "wt-wt",
                    timelimit=timelimit,
                    max_results=per_query,
                )
            )
            for r in news_results:
                results.append(
                    {
                        "url": r.get("url", ""),
                        "title": r.get("title"),
                        "body": r.get("body"),
                        "image": r.get("image"),
                        "source": r.get("source"),
                    }
                )
            logger.info(f"  news('{query[:60]}...') → {len(news_results)} results")
        except Exception as e:
            logger.warning(f"  news('{query[:60]}...') failed: {e}")

        # text() — secondary source
        try:
            text_results = list(
                DDGS().text(
                    query,
                    region=region or "wt-wt",
                    timelimit=timelimit,
                    max_results=per_query,
                )
            )
            for r in text_results:
                results.append(
                    {
                        "url": r.get("href", r.get("url", "")),
                        "title": r.get("title"),
                        "body": r.get("body"),
                    }
                )
            logger.info(f"  text('{query[:60]}...') → {len(text_results)} results")
        except Exception as e:
            logger.warning(f"  text('{query[:60]}...') failed: {e}")

    logger.info(f"DuckDuckGo total raw results: {len(results)} for prompt {prompt.id}")

    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for r in results:
        url = r.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_results.append(r)

    logger.info(
        f"DuckDuckGo unique results after dedup: {len(unique_results)} for prompt {prompt.id}"
    )

    return unique_results
