from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.sip.schemas import SIPDetail, MandateDetail
from src.sip.service import SIPService

router = APIRouter(prefix="/sips", tags=["SIPs"])

@router.get("", response_model=List[SIPDetail])
async def list_sips(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all active, paused, and completed SIP schedules for the logged-in investor."""
    service = SIPService(db)
    return await service.get_sips(current_investor.id)

@router.get("/failed", response_model=List[SIPDetail])
async def list_failed_sips(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all failed SIP schedules with reasons for failure (e.g., Insufficient balance)."""
    service = SIPService(db)
    return await service.get_failed_sips(current_investor.id)

@router.get("/{sip_id}", response_model=SIPDetail)
async def get_sip_detail(
    sip_id: str,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve properties of a specific SIP schedule by its ID (e.g. SIP-50001)."""
    service = SIPService(db)
    return await service.get_sip(current_investor.id, sip_id)

@router.get("/{sip_id}/mandate", response_model=MandateDetail)
async def get_sip_mandate(
    sip_id: str,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve mandate registration details associated with a specific SIP ID."""
    service = SIPService(db)
    return await service.get_mandate_for_sip(current_investor.id, sip_id)
