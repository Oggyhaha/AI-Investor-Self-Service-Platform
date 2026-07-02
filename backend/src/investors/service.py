from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.core.exceptions import NotFoundError
from src.investors.models import Investor
from src.investors.repository import InvestorRepository
from src.investors.schemas import ContactUpdate, InvestorProfile, DashboardData
from src.portfolio.models import PortfolioHolding
from src.sip.models import SIP
from src.notifications.models import Notification

class InvestorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = InvestorRepository(db)

    async def get_profile(self, investor_id: str) -> InvestorProfile:
        investor = await self.repo.get_by_investor_id(investor_id)
        if not investor:
            raise NotFoundError("Investor not found")
        return InvestorProfile.model_validate(investor)

    async def update_profile_contact(self, investor_id: str, request: ContactUpdate) -> InvestorProfile:
        investor = await self.repo.get_by_investor_id(investor_id)
        if not investor:
            raise NotFoundError("Investor not found")

        if request.email is not None:
            investor.email = request.email
        if request.phone is not None:
            investor.phone = request.phone
        if request.address is not None:
            investor.address = request.address
        if request.city is not None:
            investor.city = request.city
        if request.state is not None:
            investor.state = request.state
        if request.pincode is not None:
            investor.pincode = request.pincode

        updated_investor = await self.repo.update(investor)
        return InvestorProfile.model_validate(updated_investor)

    async def get_dashboard(self, investor: Investor) -> DashboardData:
        # Load portfolio summary statistics
        holdings_result = await self.db.execute(
            select(PortfolioHolding).where(PortfolioHolding.investor_id == investor.id)
        )
        holdings = holdings_result.scalars().all()
        
        total_invested = sum(h.invested_amount for h in holdings)
        current_value = sum(h.current_value for h in holdings)
        total_returns = current_value - total_invested
        total_returns_pct = (total_returns / total_invested * 100) if total_invested > 0 else 0.0

        # Load active SIPs count
        sips_result = await self.db.execute(
            select(func.count(SIP.id)).where(
                SIP.investor_id == investor.id,
                SIP.status == "active"
            )
        )
        active_sips_count = sips_result.scalar_one()

        # Load unread notifications count
        notif_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.investor_id == investor.id,
                Notification.is_read == False
            )
        )
        pending_notifications_count = notif_result.scalar_one()

        profile = InvestorProfile.model_validate(investor)
        
        return DashboardData(
            investor_profile=profile,
            total_invested=total_invested,
            current_value=current_value,
            total_returns=total_returns,
            total_returns_pct=total_returns_pct,
            active_sips_count=active_sips_count,
            pending_notifications_count=pending_notifications_count
        )
