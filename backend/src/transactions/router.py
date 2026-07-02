from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.transactions.schemas import TransactionDetail, InvestRequest
from src.transactions.service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionDetail])
async def list_transactions(
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type (purchase, redemption, sip, dividend)"),
    fund_id: Optional[int] = Query(None, description="Filter by mutual fund database ID"),
    limit: int = Query(100, ge=1, le=250, description="Limit records returned"),
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve transaction history list for the authenticated investor, filterable by type and fund."""
    service = TransactionService(db)
    return await service.get_transactions(
        investor_id=current_investor.id,
        transaction_type=transaction_type,
        fund_id=fund_id,
        limit=limit
    )

@router.post("/invest")
async def invest(
    request: InvestRequest,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Submit a mock investment order (mock payment debited from bank_account)."""
    service = TransactionService(db)
    return await service.invest_money(current_investor.id, request)
