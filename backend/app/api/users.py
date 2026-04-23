import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from PIL import UnidentifiedImageError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import UserCreate, UserResponse, UserSelfUpdate, UserUpdate
from app.utils import audit
from app.utils.image_processing import process_image
from app.utils.pagination import paginate
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])

# Directory per avatar — sottocartella di UPLOAD_DIR.
_AVATAR_SUBDIR = "avatars"
_ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_AVATAR_SIZE = 4 * 1024 * 1024  # 4 MB


# --------------------------------------------------------------------------
# SELF endpoints (usati dal profilo personale utente)
# --------------------------------------------------------------------------


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    body: UserSelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggiorna nome/email/password dell'utente corrente.

    - Per cambio password servono `current_password` + `new_password`.
    - Email e' unique: rifiuta se gia' in uso da un altro utente.
    """
    changed_fields: list[str] = []

    if body.name is not None and body.name != current_user.name:
        current_user.name = body.name
        changed_fields.append("name")

    if body.email is not None and body.email != current_user.email:
        existing = (
            db.query(User).filter(User.email == body.email, User.id != current_user.id).first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email già in uso da un altro utente")
        current_user.email = body.email
        changed_fields.append("email")

    if body.new_password is not None:
        if not body.current_password:
            raise HTTPException(
                status_code=400,
                detail="Per cambiare password è necessaria la password corrente",
            )
        if not verify_password(body.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Password corrente non valida")
        current_user.password_hash = hash_password(body.new_password)
        changed_fields.append("password")

    if not changed_fields:
        return current_user

    audit.emit(
        db,
        user_id=current_user.id,
        action="user.update",
        entity="user",
        entity_id=current_user.id,
        metadata={"fields": sorted(changed_fields), "self": True},
    )
    if "password" in changed_fields:
        audit.emit(
            db,
            user_id=current_user.id,
            action="user.password_change",
            entity="user",
            entity_id=current_user.id,
            metadata={"self": True},
        )
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Carica/sostituisce l'avatar dell'utente corrente.

    Resize + WebP via process_image (max 512px lato lungo — sufficient per
    avatar 128px @2x Retina). Il vecchio avatar locale viene eliminato.
    """
    if file.content_type not in _ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=400, detail="Tipo file non supportato. Usa JPEG, PNG, WebP o GIF."
        )

    contents = file.file.read()
    if len(contents) > _MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=400, detail="L'avatar supera la dimensione massima di 4 MB."
        )

    try:
        processed = process_image(contents, max_width=512, quality=88)
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Immagine non valida o corrotta.") from exc

    avatar_dir = os.path.join(settings.UPLOAD_DIR, _AVATAR_SUBDIR)
    os.makedirs(avatar_dir, exist_ok=True)

    filename = f"{current_user.id}_{uuid.uuid4().hex}.{processed.extension}"
    filepath = os.path.join(avatar_dir, filename)

    with open(filepath, "wb") as f:
        f.write(processed.data)

    # Elimina vecchio avatar locale (se presente nel path gestito)
    old_url = current_user.avatar_url
    if old_url and old_url.startswith(f"/uploads/{_AVATAR_SUBDIR}/"):
        old_path = os.path.join(settings.UPLOAD_DIR, old_url.split("/uploads/", 1)[1])
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass  # non critico

    current_user.avatar_url = f"/uploads/{_AVATAR_SUBDIR}/{filename}"
    audit.emit(
        db,
        user_id=current_user.id,
        action="user.update",
        entity="user",
        entity_id=current_user.id,
        metadata={"fields": ["avatar_url"], "self": True},
    )
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=MessageResponse)
def delete_my_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rimuove l'avatar dell'utente corrente (ritorna alle iniziali)."""
    if not current_user.avatar_url:
        return MessageResponse(message="Nessun avatar da rimuovere")

    old_url = current_user.avatar_url
    if old_url.startswith(f"/uploads/{_AVATAR_SUBDIR}/"):
        old_path = os.path.join(settings.UPLOAD_DIR, old_url.split("/uploads/", 1)[1])
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    current_user.avatar_url = None
    audit.emit(
        db,
        user_id=current_user.id,
        action="user.update",
        entity="user",
        entity_id=current_user.id,
        metadata={"fields": ["avatar_url"], "self": True, "removed": True},
    )
    db.commit()
    return MessageResponse(message="Avatar rimosso")


# --------------------------------------------------------------------------
# ADMIN endpoints
# --------------------------------------------------------------------------


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),
):
    query = db.query(User)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginate([UserResponse.model_validate(u) for u in users], total, page, page_size)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.flush()  # serve per avere user.id prima del commit
    audit.emit(
        db,
        user_id=current_user.id,
        action="user.create",
        entity="user",
        entity_id=user.id,
        metadata={"email": user.email, "role": user.role},
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = body.model_dump(exclude_unset=True)
    changed_fields = sorted(update_data.keys())
    role_before = user.role

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    audit.emit(
        db,
        user_id=current_user.id,
        action="user.update",
        entity="user",
        entity_id=user.id,
        metadata={"fields": changed_fields},
    )
    if "password" in changed_fields:
        audit.emit(
            db,
            user_id=current_user.id,
            action="user.password_change",
            entity="user",
            entity_id=user.id,
        )
    if "role" in changed_fields and user.role != role_before:
        audit.emit(
            db,
            user_id=current_user.id,
            action="user.role_change",
            entity="user",
            entity_id=user.id,
            metadata={"from": role_before, "to": user.role},
        )
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    audit.emit(
        db,
        user_id=current_user.id,
        action="user.deactivate",
        entity="user",
        entity_id=user.id,
    )
    db.commit()
    db.refresh(user)
    return user
