import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.core.exceptions import NotFoundError
from src.kyc.repository import KYCRepository
from src.kyc.schemas import KYCStatus, KYCUpdateRequest
from src.tickets.models import ServiceRequest

class KYCService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = KYCRepository(db)

    async def get_kyc_status(self, investor_id: int) -> KYCStatus:
        """Fetch KYC verification checklist and status for the investor."""
        kyc = await self.repo.get_by_investor_id(investor_id)
        if not kyc:
            raise NotFoundError("KYC record not found for this investor")
        return KYCStatus.model_validate(kyc)

    async def request_kyc_update(self, investor_id: int, request: KYCUpdateRequest) -> dict:
        """Initiate KYC update by creating a ServiceRequest ticket for advisor review."""
        # Check if ticket already exists
        ticket_count_result = await self.db.execute(
            select(func.count(ServiceRequest.id)).where(
                ServiceRequest.investor_id == investor_id,
                ServiceRequest.category == "kyc_update",
                ServiceRequest.status == "open"
            )
        )
        existing_tickets = ticket_count_result.scalar_one()
        if existing_tickets > 0:
            return {
                "success": False,
                "message": "You already have an open KYC re-verification request under review."
            }

        # Generate ticket ID
        time_str = datetime.datetime.now().strftime("%y%m%d%H%M")
        ticket_id = f"TKT-KYC-{time_str}"

        description = (
            f"KYC Re-verification Request details:\n"
            f"Full Name: {request.full_name}\n"
            f"Date of Birth: {request.dob}\n"
            f"PAN Number: {request.pan_number}\n"
            f"Aadhaar Number: {request.aadhaar_number}\n"
        )

        ticket = ServiceRequest(
            ticket_id=ticket_id,
            investor_id=investor_id,
            category="kyc_update",
            subject="KYC Re-verification Request",
            description=description,
            status="open",
            priority="medium",
            ai_summary="Investor has requested KYC re-verification and submitted details."
        )
        self.db.add(ticket)
        await self.db.flush()
        
        return {
            "success": True,
            "message": "KYC verification request submitted successfully. An advisor will review your documents.",
            "ticket_id": ticket_id
        }
