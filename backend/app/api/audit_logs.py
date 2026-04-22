from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_min_role
from app.database import get_db
from app.models.logs import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.utils.pagination import paginate

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: str | None = None,
    entity: str | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_min_role("admin")),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    rows = (
        query.order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return paginate(
        [AuditLogResponse.model_validate(r) for r in rows],
        total,
        page,
        page_size,
    )
