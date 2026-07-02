from typing import Sequence, Optional
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.tickets.models import ServiceRequest, ServiceRequestNote

class TicketRepository(BaseRepository[ServiceRequest]):
    def __init__(self, session: AsyncSession):
        super().__init__(ServiceRequest, session)

    async def get_by_ticket_id_detailed(self, ticket_id: str) -> Optional[ServiceRequest]:
        """Fetch a specific ServiceRequest by ticket_id, eager loading relations and notes."""
        result = await self.session.execute(
            select(ServiceRequest)
            .options(
                joinedload(ServiceRequest.investor),
                joinedload(ServiceRequest.advisor),
                selectinload(ServiceRequest.notes)
            )
            .where(ServiceRequest.ticket_id == ticket_id)
        )
        return result.scalars().first()

    async def get_by_investor(self, investor_id: int) -> Sequence[ServiceRequest]:
        """Fetch all tickets submitted by an investor."""
        result = await self.session.execute(
            select(ServiceRequest)
            .options(joinedload(ServiceRequest.investor), joinedload(ServiceRequest.advisor))
            .where(ServiceRequest.investor_id == investor_id)
            .order_by(ServiceRequest.created_at.desc())
        )
        return result.scalars().all()

    async def get_advisor_queue(self, advisor_id: Optional[int] = None) -> Sequence[ServiceRequest]:
        """Fetch advisor queue, optionally filtered by assigned advisor."""
        query = select(ServiceRequest).options(
            joinedload(ServiceRequest.investor),
            joinedload(ServiceRequest.advisor)
        )
        if advisor_id:
            query = query.where(ServiceRequest.advisor_id == advisor_id)
        
        query = query.order_by(ServiceRequest.updated_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
