from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.investors.models import Investor

class InvestorRepository(BaseRepository[Investor]):
    def __init__(self, session: AsyncSession):
        super().__init__(Investor, session)

    async def get_by_investor_id(self, investor_id: str) -> Optional[Investor]:
        """Retrieve investor details by their business investor_id (e.g., INV-10001)."""
        result = await self.session.execute(
            select(Investor).where(Investor.investor_id == investor_id)
        )
        return result.scalars().first()

    async def get_by_phone(self, phone: str) -> Optional[Investor]:
        """Retrieve investor details by phone number."""
        result = await self.session.execute(
            select(Investor).where(Investor.phone == phone)
        )
        return result.scalars().first()
