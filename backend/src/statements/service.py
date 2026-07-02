import os
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.exceptions import NotFoundError, ForbiddenError
from src.statements.repository import StatementRepository
from src.statements.schemas import StatementRequest, StatementResponse
from src.statements.models import Statement

class StatementService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = StatementRepository(db)

    async def get_statements(self, investor_id: int) -> List[StatementResponse]:
        """Retrieve all statements generated for the investor."""
        statements = await self.repo.get_by_investor_id(investor_id)
        return [StatementResponse.model_validate(s) for s in statements]

    async def generate_statement(self, investor_id: int, request: StatementRequest) -> StatementResponse:
        """Generate a mock statement document and save it to the DB."""
        # Create output directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        statements_dir = os.path.join(base_dir, "statements")
        os.makedirs(statements_dir, exist_ok=True)

        filename = f"stmt_{investor_id}_{request.statement_type}_{request.period_from}_to_{request.period_to}.txt"
        file_path = os.path.join(statements_dir, filename)

        # Write mock contents
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"==================================================\n")
            f.write(f"         ABC Mutual Fund Statement                \n")
            f.write(f"==================================================\n")
            f.write(f"Statement Type: {request.statement_type.upper()}\n")
            f.write(f"Period: {request.period_from} to {request.period_to}\n")
            f.write(f"Generated at: {datetime.datetime.now().isoformat()}\n")
            f.write(f"Investor ID Ref: {investor_id}\n")
            f.write(f"==================================================\n")
            f.write(f"This is a mocked investment statement document.   \n")
            f.write(f"For actual investments, please contact support.   \n")
            f.write(f"==================================================\n")

        statement = Statement(
            investor_id=investor_id,
            statement_type=request.statement_type,
            period_from=request.period_from,
            period_to=request.period_to,
            file_path=file_path,
            status="generated"
        )
        await self.repo.add(statement)
        return StatementResponse.model_validate(statement)

    async def get_statement_filepath(self, investor_id: int, statement_id: int) -> str:
        """Get the absolute filepath of the generated statement for download."""
        statement = await self.repo.get_by_id(statement_id)
        if not statement:
            raise NotFoundError("Statement not found")
        if statement.investor_id != investor_id:
            raise ForbiddenError("Access to this statement is forbidden")
        
        if not statement.file_path or not os.path.exists(statement.file_path):
            raise NotFoundError("Statement file does not exist on disk")
        
        return statement.file_path
