from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.sip.models import SIP, Mandate

class SIPRepository(BaseRepository[SIP]):
    def __init__(self, session: AsyncSession):
        super().__init__(SIP, session)

    async def get_sips_by_investor(self, investor_id: int) -> Sequence[SIP]:
        """Fetch all SIPs for an investor, eagerly loading Fund and Mandate details."""
        result = await self.session.execute(
            select(SIP)
            .options(joinedload(SIP.fund), joinedload(SIP.mandate))
            .where(SIP.investor_id == investor_id)
        )
        return result.scalars().all()

    async def get_sip_with_relations(self, sip_id: str, investor_id: int) -> SIP:
        """Fetch a specific SIP by its sip_id (e.g. SIP-50001) for a given investor."""
        result = await self.session.execute(
            select(SIP)
            .options(joinedload(SIP.fund), joinedload(SIP.mandate))
            .where(SIP.sip_id == sip_id, SIP.investor_id == investor_id)
        )
        return result.scalars().first()

    async def get_failed_sips_by_investor(self, investor_id: int) -> Sequence[SIP]:
        """Fetch all failed SIPs for an investor."""
        result = await self.session.execute(
            select(SIP)
            .options(joinedload(SIP.fund), joinedload(SIP.mandate))
            .where(SIP.investor_id == investor_id, SIP.status == "failed")
        )
        return result.scalars().all()
