import datetime
from pydantic import BaseModel

class StatementRequest(BaseModel):
    statement_type: str  # account/transaction/capital_gains/holding
    period_from: datetime.date
    period_to: datetime.date

class StatementResponse(BaseModel):
    id: int
    statement_type: str
    period_from: datetime.date
    period_to: datetime.date
    file_path: str
    generated_at: datetime.datetime
    status: str

    class Config:
        from_attributes = True
