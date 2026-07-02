from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.investors.schemas import ContactUpdate, InvestorProfile, DashboardData
from src.investors.service import InvestorService

router = APIRouter(prefix="/investors", tags=["Investors"])

@router.get("/profile", response_model=InvestorProfile)
async def get_profile(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the current logged-in investor's profile details."""
    service = InvestorService(db)
    return await service.get_profile(current_investor.investor_id)

@router.put("/profile/contact", response_model=InvestorProfile)
async def update_contact(
    request: ContactUpdate,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Update contact details (email, phone, address) for the logged-in investor."""
    service = InvestorService(db)
    return await service.update_profile_contact(current_investor.investor_id, request)

@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve dashboard data including profile summary and key portfolio metrics."""
    service = InvestorService(db)
    return await service.get_dashboard(current_investor)
