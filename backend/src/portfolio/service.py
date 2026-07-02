from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from src.core.exceptions import NotFoundError, ForbiddenError
from src.portfolio.repository import PortfolioRepository
from src.portfolio.schemas import PortfolioSummary, HoldingDetail
from src.portfolio.models import PortfolioHolding

class PortfolioService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PortfolioRepository(db)

    async def get_summary(self, investor_id: int) -> PortfolioSummary:
        """Calculate and return portfolio aggregate statistics and holdings details."""
        holdings = await self.repo.get_holdings_by_investor(investor_id)
        
        total_invested = sum(h.invested_amount for h in holdings)
        current_value = sum(h.current_value for h in holdings)
        absolute_returns = current_value - total_invested
        returns_pct = (absolute_returns / total_invested * 100) if total_invested > 0 else 0.0

        holding_details = [HoldingDetail.model_validate(h) for h in holdings]

        return PortfolioSummary(
            total_invested=total_invested,
            current_value=current_value,
            absolute_returns=absolute_returns,
            returns_pct=returns_pct,
            holdings=holding_details
        )

    async def get_holding(self, investor_id: int, holding_id: int) -> HoldingDetail:
        """Get details for a single portfolio holding."""
        result = await self.db.execute(
            select(PortfolioHolding)
            .options(joinedload(PortfolioHolding.fund))
            .where(PortfolioHolding.id == holding_id)
        )
        holding = result.scalars().first()
        if not holding:
            raise NotFoundError("Holding not found")
        if holding.investor_id != investor_id:
            raise ForbiddenError("Access to this holding is forbidden")
        
        return HoldingDetail.model_validate(holding)
