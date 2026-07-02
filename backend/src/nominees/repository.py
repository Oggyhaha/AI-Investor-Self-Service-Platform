from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.nominees.models import Nominee

class NomineeRepository(BaseRepository[Nominee]):
    def __init__(self, session: AsyncSession):
        super().__init__(Nominee, session)

    async def get_by_investor_id(self, investor_id: int) -> Sequence[Nominee]:
        """Fetch all registered nominees for the investor."""
        result = await self.session.execute(
            select(Nominee).where(Nominee.investor_id == investor_id)
        )
        return result.scalars().all()
