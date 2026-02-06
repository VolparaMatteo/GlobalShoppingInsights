from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.schemas.common import MessageResponse, PaginatedResponse
from app.api.deps import get_current_user
from app.utils.pagination import paginate

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=PaginatedResponse[NotificationResponse])
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    total = query.count()
    notifications = query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return paginate([NotificationResponse.model_validate(n) for n in notifications], total, page, page_size)


@router.post("/{notification_id}/read", response_model=MessageResponse)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return MessageResponse(message="Marked as read")


@router.post("/read-all", response_model=MessageResponse)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return MessageResponse(message="All notifications marked as read")
