import logging

logger = logging.getLogger(__name__)

_model = None
MODEL_NAME = "all-MiniLM-L6-v2"


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            logger.error(f"Failed to load sentence-transformers model: {e}")
            return None
    return _model


def _extract_chunks(text: str, chunk_size: int = 1500, n_chunks: int = 5) -> list[str]:
    """Extract up to n_chunks evenly-spaced segments from the full article text."""
    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    if len(text) <= chunk_size * n_chunks:
        # Text is short enough — split into consecutive non-overlapping chunks
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunk = text[i : i + chunk_size]
            if chunk.strip():
                chunks.append(chunk)
        return chunks[:n_chunks]

    # For long texts, pick evenly-spaced chunks to cover the full article
    chunks = []
    step = (len(text) - chunk_size) / (n_chunks - 1) if n_chunks > 1 else 0
    for i in range(n_chunks):
        start = int(i * step)
        chunk = text[start : start + chunk_size]
        if chunk.strip():
            chunks.append(chunk)

    return chunks


MIN_RELEVANCE_SCORE = 25


def score_article(text: str, prompt_text: str, keywords: list[str] | None = None) -> dict:
    keywords = keywords or []
    model = _get_model()
    if model is None:
        return _fallback_score(text, prompt_text, keywords)

    try:
        from sklearn.metrics.pairwise import cosine_similarity

        # Multi-chunk scoring: compare each chunk against the prompt
        # Now reads 5 chunks across the full article for deeper analysis
        chunks = _extract_chunks(text)
        chunk_embeddings = model.encode(chunks)
        prompt_embedding = model.encode([prompt_text])

        similarities = []
        for emb in chunk_embeddings:
            sim = cosine_similarity([emb], prompt_embedding)[0][0]
            similarities.append(float(sim))

        max_sim = max(similarities)
        avg_sim = sum(similarities) / len(similarities)

        # Base score: similarity * 100 (no inflating multiplier)
        base_score = int(max_sim * 100)

        # Centrality analysis: avg/max ratio — rewards articles where
        # relevance is spread across the entire text, not just one chunk
        centrality_ratio = avg_sim / max_sim if max_sim > 0 else 0
        centrality_bonus = 0
        if centrality_ratio > 0.85:
            centrality_bonus = 10
        elif centrality_ratio > 0.7:
            centrality_bonus = 5

        # Keyword analysis
        text_lower = text.lower()
        keyword_matches = 0
        keyword_bonus = 0
        keyword_penalty = 0
        if keywords:
            keyword_matches = sum(1 for kw in keywords if kw.lower() in text_lower)
            keyword_ratio = keyword_matches / len(keywords)
            keyword_bonus = int(keyword_ratio * 15)

            # Penalty: if ZERO keywords appear in the article, it is very
            # likely off-topic regardless of semantic similarity
            if keyword_matches == 0:
                keyword_penalty = -20

        # Final score clamped to [0, 100]
        score = min(100, max(0, base_score + centrality_bonus + keyword_bonus + keyword_penalty))

        explanation = []
        explanation.append(
            f"Semantic similarity: {max_sim:.2f} (avg {avg_sim:.2f} across {len(chunks)} chunks)"
        )
        if centrality_bonus > 0:
            explanation.append(
                f"Centrality bonus: +{centrality_bonus} (ratio {centrality_ratio:.2f})"
            )
        if keywords:
            explanation.append(
                f"Keywords: {keyword_matches}/{len(keywords)} matched (+{keyword_bonus})"
            )
        if keyword_penalty < 0:
            explanation.append(f"No keyword match penalty: {keyword_penalty}")
        if score >= 70:
            explanation.append("High relevance to search prompt")
        elif score >= MIN_RELEVANCE_SCORE:
            explanation.append("Moderate relevance")
        else:
            explanation.append("Low relevance — below threshold")

        suggested_tags = [kw for kw in keywords if kw.lower() in text_lower][:5]

        return {
            "score": score,
            "explanation": explanation,
            "tags": suggested_tags,
            "category": _suggest_category(text),
            "model_version": MODEL_NAME,
        }

    except Exception as e:
        logger.error(f"AI scoring error: {e}")
        return _fallback_score(text, prompt_text, keywords)


def _fallback_score(text: str, prompt_text: str, keywords: list[str] | None = None) -> dict:
    text_lower = text.lower()
    # Score based on how many words from the prompt appear in the article
    prompt_words = [w for w in prompt_text.lower().split() if len(w) > 3]
    word_matches = sum(1 for w in prompt_words if w in text_lower)
    score = int(min(100, (word_matches / max(len(prompt_words), 1)) * 100))

    explanation = [f"Prompt word match: {word_matches}/{len(prompt_words)} (fallback scoring)"]
    if keywords:
        kw_matches = sum(1 for kw in keywords if kw.lower() in text_lower)
        if kw_matches > 0:
            explanation.append(f"Keyword match: {kw_matches}/{len(keywords)}")
            score = min(100, score + 10 * kw_matches)

    tags = [kw for kw in (keywords or []) if kw.lower() in text_lower][:5]

    return {
        "score": score,
        "explanation": explanation,
        "tags": tags,
        "category": None,
        "model_version": "fallback-keyword",
    }


def _suggest_category(text: str) -> str | None:
    text_lower = text.lower()
    categories = {
        "E-commerce": ["ecommerce", "e-commerce", "online shopping", "online store", "marketplace"],
        "Retail Technology": ["retail tech", "pos system", "checkout", "payment technology"],
        "Consumer Trends": ["consumer", "trend", "shopping behavior", "spending"],
        "Logistics": ["supply chain", "logistics", "delivery", "shipping", "warehouse"],
        "Market Analysis": ["market analysis", "market research", "industry report", "forecast"],
        "Sustainability": [
            "sustainable",
            "sustainability",
            "green",
            "eco-friendly",
            "circular economy",
        ],
    }
    best_cat = None
    best_count = 0
    for category, kws in categories.items():
        count = sum(1 for kw in kws if kw in text_lower)
        if count > best_count:
            best_count = count
            best_cat = category
    return best_cat
