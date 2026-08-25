from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.models.user import User
from app.api.deps import get_current_active_admin

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def get_admin_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    return db.query(Notification).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"unread_count": count}

@router.post("/mark-read")
def mark_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
