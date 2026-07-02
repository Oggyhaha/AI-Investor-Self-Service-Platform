from typing import Sequence
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.notifications.models import Notification

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session: AsyncSession):
        super().__init__(Notification, session)

    async def get_by_investor_id(self, investor_id: int) -> Sequence[Notification]:
        """Fetch all notifications for the investor, sorted by creation date."""
        result = await self.session.execute(
            select(Notification)
            .where(Notification.investor_id == investor_id)
            .order_by(Notification.created_at.desc())
        )
        return result.scalars().all()

    async def mark_all_as_read(self, investor_id: int) -> None:
        """Mark all unread notifications as read for this investor."""
        await self.session.execute(
            update(Notification)
            .where(Notification.investor_id == investor_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await self.session.flush()
