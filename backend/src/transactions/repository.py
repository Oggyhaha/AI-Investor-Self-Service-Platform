from typing import Sequence, Optional
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.transactions.models import Transaction

class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self, session: AsyncSession):
        super().__init__(Transaction, session)

    async def get_by_investor_id(
        self,
        investor_id: int,
        transaction_type: Optional[str] = None,
        fund_id: Optional[int] = None,
        limit: int = 100
    ) -> Sequence[Transaction]:
        """Fetch transaction history for the investor, eagerly loading Fund details."""
        query = select(Transaction).options(joinedload(Transaction.fund)).where(Transaction.investor_id == investor_id)
        
        if transaction_type:
            query = query.where(Transaction.type == transaction_type)
        if fund_id:
            query = query.where(Transaction.fund_id == fund_id)
            
        query = query.order_by(Transaction.transaction_date.desc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
