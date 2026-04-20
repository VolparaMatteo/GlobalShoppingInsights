from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.utils import audit
from app.utils.pagination import paginate
from app.utils.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginate(
        [UserResponse.model_validate(u) for u in users], total, page, page_size
    )


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
