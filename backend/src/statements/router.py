from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.statements.schemas import StatementRequest, StatementResponse
from src.statements.service import StatementService

router = APIRouter(prefix="/statements", tags=["Statements"])

@router.get("", response_model=List[StatementResponse])
async def list_statements(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all previously generated statements for the current investor."""
    service = StatementService(db)
    return await service.get_statements(current_investor.id)

@router.post("/generate", response_model=StatementResponse)
async def generate_statement(
    request: StatementRequest,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new account, transaction, or capital gains statement for a specific period."""
    service = StatementService(db)
    return await service.generate_statement(current_investor.id, request)

@router.get("/{statement_id}/download")
async def download_statement(
    statement_id: int,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Download the statement file (TXT format) generated previously."""
    service = StatementService(db)
    file_path = await service.get_statement_filepath(current_investor.id, statement_id)
    filename = os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/plain"
    )
