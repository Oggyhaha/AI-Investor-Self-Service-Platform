from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.kyc.schemas import KYCStatus, KYCUpdateRequest
from src.kyc.service import KYCService

router = APIRouter(prefix="/kyc", tags=["KYC"])

@router.get("", response_model=KYCStatus)
async def get_kyc_status(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full KYC status checklist (PAN, Aadhaar, Photo and Address validation)."""
    service = KYCService(db)
    return await service.get_kyc_status(current_investor.id)

@router.post("/update-request")
async def update_kyc(
    request: KYCUpdateRequest,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Submit KYC details for re-verification (creates a service request ticket)."""
    service = KYCService(db)
    return await service.request_kyc_update(current_investor.id, request)
