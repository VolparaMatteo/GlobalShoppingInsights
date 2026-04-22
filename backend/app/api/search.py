from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.article import Article
from app.models.search import SearchResult, SearchRun
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.search import SearchResultResponse, SearchRunResponse
from app.utils.pagination import paginate

router = APIRouter(prefix="/search-runs", tags=["search"])


@router.get("", response_model=PaginatedResponse[SearchRunResponse])
def list_search_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    prompt_id: int | None = None,
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(SearchRun)
    if prompt_id:
        query = query.filter(SearchRun.prompt_id == prompt_id)
    if status_filter:
        query = query.filter(SearchRun.status == status_filter)
    total = query.count()
    runs = (
        query.order_by(SearchRun.started_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return paginate([SearchRunResponse.model_validate(r) for r in runs], total, page, page_size)


@router.get("/{run_id}", response_model=SearchRunResponse)
def get_search_run(
    run_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    run = db.query(SearchRun).filter(SearchRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Search run not found")

    # LEFT JOIN con Article così prendiamo anche l'ai_score in un colpo solo.
    rows = (
        db.query(SearchResult, Article.ai_score)
        .outerjoin(Article, SearchResult.article_id == Article.id)
        .filter(SearchResult.search_run_id == run_id)
        .order_by(SearchResult.id.asc())
        .all()
    )

    result_responses: list[SearchResultResponse] = []
    for sr, score in rows:
        resp = SearchResultResponse.model_validate(sr)
        resp.article_score = score
        result_responses.append(resp)

    response = SearchRunResponse.model_validate(run)
    response.results = result_responses
    return response
