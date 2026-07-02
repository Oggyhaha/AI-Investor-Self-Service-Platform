from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.exceptions import NotFoundError, ForbiddenError
from src.notifications.repository import NotificationRepository
from src.notifications.schemas import NotificationDetail

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def get_notifications(self, investor_id: int) -> List[NotificationDetail]:
        """Fetch all notifications for the investor."""
        notifs = await self.repo.get_by_investor_id(investor_id)
        return [NotificationDetail.model_validate(n) for n in notifs]

    async def mark_as_read(self, investor_id: int, notification_id: int) -> NotificationDetail:
        """Mark a specific notification as read."""
        notif = await self.repo.get_by_id(notification_id)
        if not notif:
            raise NotFoundError("Notification not found")
        if notif.investor_id != investor_id:
            raise ForbiddenError("Access to this notification is forbidden")
        
        notif.is_read = True
        updated = await self.repo.update(notif)
        return NotificationDetail.model_validate(updated)

    async def mark_all_read(self, investor_id: int) -> dict:
        """Mark all unread notifications for the investor as read."""
        await self.repo.mark_all_as_read(investor_id)
        return {"success": True, "message": "All notifications marked as read"}
