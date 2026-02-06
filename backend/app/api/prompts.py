from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.prompt import Prompt
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
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Prompt).filter(Prompt.is_active == True)
    if search:
        query = query.filter(Prompt.title.ilike(f"%{search}%"))
    total = query.count()
    prompts = query.order_by(Prompt.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return paginate([PromptResponse.model_validate(p) for p in prompts], total, page, page_size)


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
    return prompt


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
