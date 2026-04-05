from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.prompt import Prompt
from app.models.prompt_folder import PromptFolder
from app.models.search import SearchRun
from app.schemas.prompt import PromptCreate, PromptUpdate, PromptResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.api.deps import get_current_user, require_min_role
from app.utils.pagination import paginate

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=PaginatedResponse[PromptResponse])
def list_prompts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    folder_id: Optional[int] = None,
    unfiled: Optional[bool] = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Prompt).filter(Prompt.is_active == True)
    if search:
        query = query.filter(Prompt.title.ilike(f"%{search}%"))
    if folder_id is not None:
        query = query.filter(Prompt.folder_id == folder_id)
    elif unfiled:
        query = query.filter(Prompt.folder_id.is_(None))
    total = query.count()
    prompts = query.order_by(Prompt.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Compute last_run_at for each prompt in a single query
    prompt_ids = [p.id for p in prompts]
    last_runs = {}
    if prompt_ids:
        rows = (
            db.query(SearchRun.prompt_id, sa_func.max(SearchRun.started_at))
            .filter(SearchRun.prompt_id.in_(prompt_ids))
            .group_by(SearchRun.prompt_id)
            .all()
        )
        last_runs = {pid: started for pid, started in rows}

    # Build folder name lookup for prompts that have a folder_id
    folder_ids = {p.folder_id for p in prompts if p.folder_id is not None}
    folder_names = {}
    if folder_ids:
        rows = db.query(PromptFolder.id, PromptFolder.name).filter(PromptFolder.id.in_(folder_ids)).all()
        folder_names = {fid: fname for fid, fname in rows}

    items = []
    for p in prompts:
        resp = PromptResponse.model_validate(p)
        resp.last_run_at = last_runs.get(p.id)
        resp.folder_name = folder_names.get(p.folder_id) if p.folder_id else None
        items.append(resp)

    return paginate(items, total, page, page_size)


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    body: PromptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("contributor")),
):
    prompt = Prompt(**body.model_dump(), created_by=current_user.id)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    resp = PromptResponse.model_validate(prompt)
    last_run = (
        db.query(sa_func.max(SearchRun.started_at))
        .filter(SearchRun.prompt_id == prompt_id)
        .scalar()
    )
    resp.last_run_at = last_run
    if prompt.folder_id:
        folder = db.query(PromptFolder).filter(PromptFolder.id == prompt.folder_id).first()
        resp.folder_name = folder.name if folder else None
    return resp


@router.patch("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: int,
    body: PromptUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("contributor")),
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(prompt, key, value)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.delete("/{prompt_id}", response_model=MessageResponse)
def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    prompt.is_active = False
    db.commit()
    return MessageResponse(message="Prompt deleted")


@router.post("/{prompt_id}/run", response_model=MessageResponse)
def run_prompt_search(
    prompt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("contributor")),
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    from app.services.discovery_service import run_discovery_pipeline
    background_tasks.add_task(run_discovery_pipeline, prompt_id, current_user.id)
    return MessageResponse(message="Search started")
