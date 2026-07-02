from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.notifications.schemas import NotificationDetail
from src.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationDetail])
async def list_notifications(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all read and unread notifications for the logged-in investor."""
    service = NotificationService(db)
    return await service.get_notifications(current_investor.id)

@router.put("/read-all")
async def mark_all_read(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread notifications as read."""
    service = NotificationService(db)
    return await service.mark_all_read(current_investor.id)

@router.put("/{notification_id}/read", response_model=NotificationDetail)
async def mark_read(
    notification_id: int,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific notification ID as read."""
    service = NotificationService(db)
    return await service.mark_as_read(current_investor.id, notification_id)
