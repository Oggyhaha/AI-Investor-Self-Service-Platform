import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.exceptions import NotFoundError
from src.nominees.repository import NomineeRepository
from src.nominees.schemas import NomineeDetail, NomineeUpdateRequest
from src.tickets.models import ServiceRequest

class NomineeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NomineeRepository(db)

    async def get_nominees(self, investor_id: int) -> List[NomineeDetail]:
        """Retrieve the list of registered nominees for the investor."""
        nominees = await self.repo.get_by_investor_id(investor_id)
        return [NomineeDetail.model_validate(n) for n in nominees]

    async def request_nominee_update(self, investor_id: int, request: NomineeUpdateRequest) -> dict:
        """Create a service request ticket for nominee update/addition review."""
        time_str = datetime.datetime.now().strftime("%y%m%d%H%M")
        ticket_id = f"TKT-NOM-{time_str}"

        description = (
            f"Nominee Change Request details:\n"
            f"Nominee Name: {request.nominee_name}\n"
            f"Relationship: {request.relationship}\n"
            f"Date of Birth: {request.date_of_birth}\n"
            f"Allocation: {request.allocation_pct}%\n"
            f"Guardian Name (if minor): {request.guardian_name or 'N/A'}\n"
        )

        ticket = ServiceRequest(
            ticket_id=ticket_id,
            investor_id=investor_id,
            category="nominee_change",
            subject="Nominee Update Request",
            description=description,
            status="open",
            priority="medium",
            ai_summary="Investor has requested a nominee change and submitted details."
        )
        self.db.add(ticket)
        await self.db.flush()

        return {
            "success": True,
            "message": "Nominee update request submitted successfully. An advisor will review your request.",
            "ticket_id": ticket_id
        }
