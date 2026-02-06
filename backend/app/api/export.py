import csv
import io
import json
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.article import Article
from app.api.deps import get_current_user

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/articles")
def export_articles(
    format: str = Query("csv", regex="^(csv|json)$"),
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Article)
    if status_filter:
        query = query.filter(Article.status == status_filter)
    if language:
        query = query.filter(Article.language == language)
    articles = query.order_by(Article.created_at.desc()).all()

    if format == "json":
        data = [
            {
                "id": a.id, "title": a.title, "url": a.canonical_url,
                "domain": a.source_domain, "status": a.status, "language": a.language,
                "country": a.country, "ai_score": a.ai_score,
                "published_at": str(a.published_at) if a.published_at else None,
                "created_at": str(a.created_at),
            }
            for a in articles
        ]
        return StreamingResponse(
            io.BytesIO(json.dumps(data, indent=2).encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=articles.json"},
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "title", "url", "domain", "status", "language", "country", "ai_score", "published_at", "created_at"])
        for a in articles:
            writer.writerow([
                a.id, a.title, a.canonical_url, a.source_domain, a.status,
                a.language, a.country, a.ai_score, a.published_at, a.created_at,
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=articles.csv"},
        )
