from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_min_role
from app.database import get_db
from app.models.prompt import Prompt
from app.models.prompt_folder import PromptFolder
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.prompt_folder import PromptFolderCreate, PromptFolderResponse, PromptFolderUpdate

router = APIRouter(prefix="/prompt-folders", tags=["prompt-folders"])


def _build_tree(folders: list, counts: dict) -> list[PromptFolderResponse]:
    """Build a nested tree from a flat list of folders."""
    by_id: dict[int, PromptFolderResponse] = {}
    for f in folders:
        resp = PromptFolderResponse.model_validate(f)
        resp.prompt_count = counts.get(f.id, 0)
        resp.children = []
        by_id[f.id] = resp

    roots: list[PromptFolderResponse] = []
    for f in folders:
        node = by_id[f.id]
        if f.parent_id and f.parent_id in by_id:
            by_id[f.parent_id].children.append(node)
        else:
            roots.append(node)

    return roots


def _collect_descendant_ids(folder_id: int, db: Session) -> set[int]:
    """Recursively collect all descendant folder IDs."""
    ids: set[int] = set()
    queue = [folder_id]
    while queue:
        current = queue.pop()
        children = db.query(PromptFolder.id).filter(PromptFolder.parent_id == current).all()
        for (child_id,) in children:
            ids.add(child_id)
            queue.append(child_id)
    return ids


def _is_descendant_of(folder_id: int, ancestor_id: int, db: Session) -> bool:
    """Check if ancestor_id is a descendant of folder_id (would create a cycle)."""
    descendants = _collect_descendant_ids(folder_id, db)
    return ancestor_id in descendants


@router.get("", response_model=list[PromptFolderResponse])
def list_prompt_folders(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    folders = db.query(PromptFolder).order_by(PromptFolder.name).all()

    counts = dict(
        db.query(Prompt.folder_id, sa_func.count(Prompt.id))
        .filter(Prompt.is_active, Prompt.folder_id.isnot(None))
        .group_by(Prompt.folder_id)
        .all()
    )

    return _build_tree(folders, counts)


@router.post("", response_model=PromptFolderResponse, status_code=status.HTTP_201_CREATED)
def create_prompt_folder(
    body: PromptFolderCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("contributor")),
):
    # Validate parent exists
    if body.parent_id is not None:
        parent = db.query(PromptFolder).filter(PromptFolder.id == body.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Cartella padre non trovata")

    # Uniqueness check: (name, parent_id) — treat None parent_id specially
    existing_query = db.query(PromptFolder).filter(PromptFolder.name == body.name)
    if body.parent_id is None:
        existing_query = existing_query.filter(PromptFolder.parent_id.is_(None))
    else:
        existing_query = existing_query.filter(PromptFolder.parent_id == body.parent_id)
    if existing_query.first():
        raise HTTPException(
            status_code=409, detail="Una cartella con questo nome esiste già in questa posizione"
        )

    folder = PromptFolder(name=body.name, parent_id=body.parent_id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    resp = PromptFolderResponse.model_validate(folder)
    resp.prompt_count = 0
    resp.children = []
    return resp


@router.patch("/{folder_id}", response_model=PromptFolderResponse)
def update_prompt_folder(
    folder_id: int,
    body: PromptFolderUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("contributor")),
):
    folder = db.query(PromptFolder).filter(PromptFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Cartella non trovata")

    new_name = body.name if body.name is not None else folder.name
    # Determine new parent_id: use body value if provided, else keep current
    new_parent_id = body.parent_id if body.parent_id is not None else folder.parent_id

    # Validate parent_id changes
    if body.parent_id is not None:
        if body.parent_id == folder_id:
            raise HTTPException(
                status_code=400, detail="Una cartella non può essere figlia di sé stessa"
            )
        parent = db.query(PromptFolder).filter(PromptFolder.id == body.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Cartella padre non trovata")
        if _is_descendant_of(folder_id, body.parent_id, db):
            raise HTTPException(
                status_code=400, detail="Spostamento non valido: creerebbe un ciclo"
            )

    # Uniqueness check for (name, parent_id)
    dup_query = db.query(PromptFolder).filter(
        PromptFolder.name == new_name,
        PromptFolder.id != folder_id,
    )
    if new_parent_id is None:
        dup_query = dup_query.filter(PromptFolder.parent_id.is_(None))
    else:
        dup_query = dup_query.filter(PromptFolder.parent_id == new_parent_id)
    if dup_query.first():
        raise HTTPException(
            status_code=409, detail="Una cartella con questo nome esiste già in questa posizione"
        )

    if body.name is not None:
        folder.name = body.name
    if body.parent_id is not None:
        folder.parent_id = body.parent_id

    db.commit()
    db.refresh(folder)

    count = (
        db.query(sa_func.count(Prompt.id))
        .filter(Prompt.folder_id == folder_id, Prompt.is_active)
        .scalar()
    )
    resp = PromptFolderResponse.model_validate(folder)
    resp.prompt_count = count or 0
    resp.children = []
    return resp


@router.delete("/{folder_id}", response_model=MessageResponse)
def delete_prompt_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("editor")),
):
    folder = db.query(PromptFolder).filter(PromptFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Cartella non trovata")

    # Collect all descendant folder IDs
    descendant_ids = _collect_descendant_ids(folder_id, db)
    all_folder_ids = {folder_id} | descendant_ids

    # Unlink prompts from this folder and all descendants
    db.query(Prompt).filter(Prompt.folder_id.in_(all_folder_ids)).update(
        {Prompt.folder_id: None}, synchronize_session="fetch"
    )

    # Delete the folder (CASCADE will remove descendants)
    db.delete(folder)
    db.commit()
    return MessageResponse(message="Cartella eliminata")
