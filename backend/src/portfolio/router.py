from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.portfolio.schemas import PortfolioSummary, HoldingDetail
from src.portfolio.service import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve portfolio summaries containing total invested, current valuation, and total returns."""
    service = PortfolioService(db)
    return await service.get_summary(current_investor.id)

@router.get("/holdings", response_model=List[HoldingDetail])
async def get_portfolio_holdings(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed holdings breakdown list for the authenticated investor."""
    service = PortfolioService(db)
    summary = await service.get_summary(current_investor.id)
    return summary.holdings

@router.get("/{holding_id}", response_model=HoldingDetail)
async def get_holding_detail(
    holding_id: int,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed holding properties for a specific portfolio asset ID."""
    service = PortfolioService(db)
    return await service.get_holding(current_investor.id, holding_id)
