from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.kyc.models import KYC

class KYCRepository(BaseRepository[KYC]):
    def __init__(self, session: AsyncSession):
        super().__init__(KYC, session)

    async def get_by_investor_id(self, investor_id: int) -> Optional[KYC]:
        """Fetch KYC registration status for the investor."""
        result = await self.session.execute(
            select(KYC).where(KYC.investor_id == investor_id)
        )
        return result.scalars().first()
