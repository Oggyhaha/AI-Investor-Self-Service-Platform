import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.core.exceptions import NotFoundError, ForbiddenError
from src.tickets.repository import TicketRepository
from src.tickets.models import ServiceRequest, ServiceRequestNote
from src.tickets.schemas import TicketBrief, TicketDetail, TicketUpdate, NoteCreate, NoteDetail
from src.advisors.models import Advisor

class TicketService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TicketRepository(db)

    async def get_tickets_for_investor(self, investor_id: int) -> List[TicketBrief]:
        """Get tickets submitted by an investor."""
        tickets = await self.repo.get_by_investor(investor_id)
        return [
            TicketBrief(
                id=t.id,
                ticket_id=t.ticket_id,
                category=t.category,
                subject=t.subject,
                status=t.status,
                priority=t.priority,
                created_at=t.created_at,
                updated_at=t.updated_at,
                investor_name=t.investor.full_name,
                investor_phone=t.investor.phone
            )
            for t in tickets
        ]

    async def get_tickets_for_advisor(self, advisor_id: Optional[int] = None) -> List[TicketBrief]:
        """Get advisor queue tickets."""
        tickets = await self.repo.get_advisor_queue(advisor_id)
        return [
            TicketBrief(
                id=t.id,
                ticket_id=t.ticket_id,
                category=t.category,
                subject=t.subject,
                status=t.status,
                priority=t.priority,
                created_at=t.created_at,
                updated_at=t.updated_at,
                investor_name=t.investor.full_name,
                investor_phone=t.investor.phone
            )
            for t in tickets
        ]

    async def get_ticket_detail(self, ticket_id: str, current_user_role: str, current_user_db_id: int) -> TicketDetail:
        """Fetch detailed information of a service request ticket."""
        ticket = await self.repo.get_by_ticket_id_detailed(ticket_id)
        if not ticket:
            raise NotFoundError("Ticket not found")
        
        # Access control
        if current_user_role == "investor" and ticket.investor_id != current_user_db_id:
            raise ForbiddenError("Access to this ticket is forbidden")
        
        notes = [
            NoteDetail(
                id=n.id,
                author_type=n.author_type,
                author_id=n.author_id,
                content=n.content,
                created_at=n.created_at
            )
            for n in ticket.notes
        ]

        return TicketDetail(
            id=ticket.id,
            ticket_id=ticket.ticket_id,
            category=ticket.category,
            subject=ticket.subject,
            description=ticket.description,
            status=ticket.status,
            priority=ticket.priority,
            ai_summary=ticket.ai_summary,
            resolution=ticket.resolution,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            resolved_at=ticket.resolved_at,
            investor_name=ticket.investor.full_name,
            investor_id=ticket.investor.investor_id,
            advisor_name=ticket.advisor.full_name if ticket.advisor else None,
            notes=notes
        )

    async def update_ticket(self, ticket_id: str, request: TicketUpdate, current_advisor: Advisor) -> TicketDetail:
        """Update ticket status, priority, resolution, or assigned advisor."""
        ticket = await self.repo.get_by_ticket_id_detailed(ticket_id)
        if not ticket:
            raise NotFoundError("Ticket not found")

        if request.status is not None:
            ticket.status = request.status
            if request.status in ["resolved", "closed"]:
                ticket.resolved_at = datetime.datetime.now(datetime.timezone.utc)
        if request.priority is not None:
            ticket.priority = request.priority
        if request.resolution is not None:
            ticket.resolution = request.resolution
        if request.advisor_id is not None:
            ticket.advisor_id = request.advisor_id

        await self.repo.update(ticket)
        return await self.get_ticket_detail(ticket_id, "advisor", current_advisor.id)

    async def add_note_to_ticket(self, ticket_id: str, request: NoteCreate, current_advisor: Advisor) -> NoteDetail:
        """Add a manual note to the ticket."""
        ticket = await self.repo.get_by_ticket_id_detailed(ticket_id)
        if not ticket:
            raise NotFoundError("Ticket not found")

        note = ServiceRequestNote(
            request_id=ticket.id,
            author_type="advisor",
            author_id=current_advisor.id,
            content=request.content
        )
        self.db.add(note)
        await self.db.flush()
        await self.db.refresh(note)

        # Update ticket updated timestamp
        ticket.updated_at = datetime.datetime.now(datetime.timezone.utc)
        await self.repo.update(ticket)

        return NoteDetail(
            id=note.id,
            author_type=note.author_type,
            author_id=note.author_id,
            content=note.content,
            created_at=note.created_at
        )
class TicketRepositoryWrapper:
    pass
