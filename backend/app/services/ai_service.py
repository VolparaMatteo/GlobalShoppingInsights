import logging
from typing import List, Optional

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


def score_article(text: str, prompt_text: str, keywords: Optional[List[str]] = None) -> dict:
    keywords = keywords or []
    model = _get_model()
    if model is None:
        return _fallback_score(text, prompt_text, keywords)

    try:
        from sklearn.metrics.pairwise import cosine_similarity

        # Compare article text against the full natural-language prompt
        embeddings = model.encode([text[:2000], prompt_text])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

        score = int(min(100, max(0, similarity * 100 * 1.5)))

        explanation = []
        if keywords:
            keyword_matches = sum(1 for kw in keywords if kw.lower() in text.lower())
            if keyword_matches > 0:
                explanation.append(f"Matched {keyword_matches}/{len(keywords)} keywords")
        explanation.append(f"Semantic similarity: {similarity:.2f}")
        if score >= 70:
            explanation.append("High relevance to search prompt")
        elif score >= 40:
            explanation.append("Moderate relevance")
        else:
            explanation.append("Low relevance")

        suggested_tags = [kw for kw in keywords if kw.lower() in text.lower()] if keywords else []

        return {
            "score": score,
            "explanation": explanation,
            "tags": suggested_tags[:5],
            "category": _suggest_category(text),
            "model_version": MODEL_NAME,
        }

    except Exception as e:
        logger.error(f"AI scoring error: {e}")
        return _fallback_score(text, prompt_text, keywords)


def _fallback_score(text: str, prompt_text: str, keywords: Optional[List[str]] = None) -> dict:
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


def _suggest_category(text: str) -> Optional[str]:
    text_lower = text.lower()
    categories = {
        "E-commerce": ["ecommerce", "e-commerce", "online shopping", "online store", "marketplace"],
        "Retail Technology": ["retail tech", "pos system", "checkout", "payment technology"],
        "Consumer Trends": ["consumer", "trend", "shopping behavior", "spending"],
        "Logistics": ["supply chain", "logistics", "delivery", "shipping", "warehouse"],
        "Market Analysis": ["market analysis", "market research", "industry report", "forecast"],
        "Sustainability": ["sustainable", "sustainability", "green", "eco-friendly", "circular economy"],
    }
    best_cat = None
    best_count = 0
    for category, kws in categories.items():
        count = sum(1 for kw in kws if kw in text_lower)
        if count > best_count:
            best_count = count
            best_cat = category
    return best_cat
