from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.nominees.schemas import NomineeDetail, NomineeUpdateRequest
from src.nominees.service import NomineeService

router = APIRouter(prefix="/nominees", tags=["Nominees"])

@router.get("", response_model=List[NomineeDetail])
async def list_nominees(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of registered nominees for the current logged-in investor."""
    service = NomineeService(db)
    return await service.get_nominees(current_investor.id)

@router.post("/update-request")
async def update_nominees(
    request: NomineeUpdateRequest,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Submit nominee change request (creates a service request ticket)."""
    service = NomineeService(db)
    return await service.request_nominee_update(current_investor.id, request)
