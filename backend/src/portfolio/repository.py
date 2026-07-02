from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.portfolio.models import PortfolioHolding, Fund

class PortfolioRepository(BaseRepository[PortfolioHolding]):
    def __init__(self, session: AsyncSession):
        super().__init__(PortfolioHolding, session)

    async def get_holdings_by_investor(self, investor_id: int) -> Sequence[PortfolioHolding]:
        """Fetch all portfolio holdings for an investor, including Fund relationships."""
        result = await self.session.execute(
            select(PortfolioHolding)
            .options(joinedload(PortfolioHolding.fund))
            .where(PortfolioHolding.investor_id == investor_id)
        )
        return result.scalars().all()

class FundRepository(BaseRepository[Fund]):
    def __init__(self, session: AsyncSession):
        super().__init__(Fund, session)

    async def get_by_code(self, fund_code: str) -> Fund:
        """Fetch a mutual fund details by its unique fund code."""
        result = await self.session.execute(
            select(Fund).where(Fund.fund_code == fund_code)
        )
        return result.scalars().first()
