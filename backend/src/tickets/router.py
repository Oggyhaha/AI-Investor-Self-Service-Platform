from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.core.database import get_db
from src.auth.dependencies import get_current_investor, get_current_advisor, get_current_user_payload
from src.investors.models import Investor
from src.advisors.models import Advisor
from src.tickets.schemas import TicketBrief, TicketDetail, TicketUpdate, NoteCreate, NoteDetail
from src.tickets.service import TicketService

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.get("", response_model=List[TicketBrief])
async def list_investor_tickets(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of tickets/service requests submitted by the logged-in investor."""
    service = TicketService(db)
    return await service.get_tickets_for_investor(current_investor.id)

@router.get("/queue", response_model=List[TicketBrief])
async def list_advisor_queue(
    advisor_id: Optional[int] = Query(None, description="Filter queue by advisor ID"),
    current_advisor: Advisor = Depends(get_current_advisor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full support queue for advisors, optionally filtered by assignment."""
    service = TicketService(db)
    return await service.get_tickets_for_advisor(advisor_id)

@router.get("/{ticket_id}", response_model=TicketDetail)
async def get_ticket(
    ticket_id: str,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed properties of a support ticket (accessible by submitting investor or any advisor)."""
    service = TicketService(db)
    # Extract user ID and role from token payload
    role = payload.get("role")
    sub = payload.get("sub")
    
    # We need the database ID (integer) of the investor or advisor
    if role == "investor":
        from src.investors.models import Investor
        from sqlalchemy import select
        res = await db.execute(select(Investor).where(Investor.investor_id == sub))
        user = res.scalars().first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_db_id = user.id
    else:
        from src.advisors.models import Advisor
        from sqlalchemy import select
        res = await db.execute(select(Advisor).where(Advisor.advisor_id == sub))
        user = res.scalars().first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_db_id = user.id
        
    return await service.get_ticket_detail(ticket_id, role, user_db_id)

@router.put("/{ticket_id}", response_model=TicketDetail)
async def update_ticket(
    ticket_id: str,
    request: TicketUpdate,
    current_advisor: Advisor = Depends(get_current_advisor),
    db: AsyncSession = Depends(get_db),
):
    """Update support ticket status, priority, or details (advisor only)."""
    service = TicketService(db)
    return await service.update_ticket(ticket_id, request, current_advisor)

@router.post("/{ticket_id}/notes", response_model=NoteDetail)
async def add_note(
    ticket_id: str,
    request: NoteCreate,
    current_advisor: Advisor = Depends(get_current_advisor),
    db: AsyncSession = Depends(get_db),
):
    """Add a support note to the ticket history (advisor only)."""
    service = TicketService(db)
    return await service.add_note_to_ticket(ticket_id, request, current_advisor)
