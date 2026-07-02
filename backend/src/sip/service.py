from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.exceptions import NotFoundError
from src.sip.repository import SIPRepository
from src.sip.schemas import SIPDetail, MandateDetail

class SIPService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SIPRepository(db)

    async def get_sips(self, investor_id: int) -> List[SIPDetail]:
        """Retrieve all SIP investments for the given investor."""
        sips = await self.repo.get_sips_by_investor(investor_id)
        return [SIPDetail.model_validate(s) for s in sips]

    async def get_sip(self, investor_id: int, sip_id: str) -> SIPDetail:
        """Retrieve detailed properties of a specific SIP."""
        sip = await self.repo.get_sip_with_relations(sip_id, investor_id)
        if not sip:
            raise NotFoundError("SIP investment details not found")
        return SIPDetail.model_validate(sip)

    async def get_failed_sips(self, investor_id: int) -> List[SIPDetail]:
        """Retrieve all failed SIPs for the investor."""
        sips = await self.repo.get_failed_sips_by_investor(investor_id)
        return [SIPDetail.model_validate(s) for s in sips]

    async def get_mandate_for_sip(self, investor_id: int, sip_id: str) -> MandateDetail:
        """Retrieve mandate parameters registered for a given SIP."""
        sip = await self.repo.get_sip_with_relations(sip_id, investor_id)
        if not sip:
            raise NotFoundError("SIP investment not found")
        if not sip.mandate:
            raise NotFoundError("No mandate associated with this SIP")
        return MandateDetail.model_validate(sip.mandate)
