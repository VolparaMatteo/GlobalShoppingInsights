from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.article import Article
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(prefix="/articles/{article_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentResponse])
def list_comments(
    article_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    comments = (
        db.query(Comment)
        .filter(Comment.article_id == article_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    result = []
    for c in comments:
        resp = CommentResponse.model_validate(c)
        user = db.query(User).filter(User.id == c.user_id).first()
        resp.user_name = user.name if user else None
        result.append(resp)
    return result


@router.post("", response_model=CommentResponse, status_code=201)
def add_comment(
    article_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    comment = Comment(
        article_id=article_id,
        user_id=current_user.id,
        body=body.body,
        mentions=body.mentions,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    resp = CommentResponse.model_validate(comment)
    resp.user_name = current_user.name
    return resp
