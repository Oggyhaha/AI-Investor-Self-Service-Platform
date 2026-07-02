from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import datetime
import random

from src.transactions.repository import TransactionRepository
from src.transactions.schemas import TransactionDetail, InvestRequest
from src.portfolio.models import Fund, PortfolioHolding
from src.transactions.models import Transaction
from src.notifications.models import Notification
from src.core.exceptions import NotFoundError

class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TransactionRepository(db)

    async def get_transactions(
        self,
        investor_id: int,
        transaction_type: Optional[str] = None,
        fund_id: Optional[int] = None,
        limit: int = 100
    ) -> List[TransactionDetail]:
        """Fetch filtered transaction history list."""
        txns = await self.repo.get_by_investor_id(
            investor_id=investor_id,
            transaction_type=transaction_type,
            fund_id=fund_id,
            limit=limit
        )
        return [TransactionDetail.model_validate(t) for t in txns]

    async def invest_money(self, investor_id: int, request: InvestRequest) -> dict:
        """Process a mock investment into a mutual fund and update portfolio holdings."""
        # 1. Fetch Mutual Fund Details
        fund_res = await self.db.execute(select(Fund).where(Fund.id == request.fund_id))
        fund = fund_res.scalars().first()
        if not fund:
            raise NotFoundError("Mutual Fund not found")

        # 2. Compute Allocation
        txn_id = f"TXN-PUR-{random.randint(10000, 99999)}"
        units_allocated = request.amount / fund.nav

        # 3. Create Transaction record
        new_txn = Transaction(
            investor_id=investor_id,
            fund_id=request.fund_id,
            transaction_id=txn_id,
            type="purchase",
            amount=request.amount,
            units=units_allocated,
            nav=fund.nav,
            status="completed",
            transaction_date=datetime.date.today()
        )
        self.db.add(new_txn)

        # 4. Create or Update Portfolio Holding
        holding_res = await self.db.execute(
            select(PortfolioHolding)
            .where(PortfolioHolding.investor_id == investor_id, PortfolioHolding.fund_id == request.fund_id)
        )
        holding = holding_res.scalars().first()

        if holding:
            # Update holding values
            holding.units += units_allocated
            holding.invested_amount += request.amount
            holding.current_value = float(holding.units) * fund.nav
            holding.returns_pct = ((holding.current_value - float(holding.invested_amount)) / float(holding.invested_amount)) * 100
        else:
            # Create holding values
            holding = PortfolioHolding(
                investor_id=investor_id,
                fund_id=request.fund_id,
                units=units_allocated,
                invested_amount=request.amount,
                current_value=request.amount,
                returns_pct=0.0,
                purchase_date=datetime.date.today()
            )
            self.db.add(holding)

        # 5. Create Notification
        notif = Notification(
            investor_id=investor_id,
            title="Investment Processed",
            message=f"₹{request.amount:,.2f} invested in {fund.fund_name}. Allocated {units_allocated:,.4f} units.",
            type="sip_reminder",
            is_read=False,
            link="/portfolio"
        )
        self.db.add(notif)
        
        await self.db.flush()

        return {
            "success": True,
            "message": "Investment processed successfully",
            "transaction_id": txn_id
        }
