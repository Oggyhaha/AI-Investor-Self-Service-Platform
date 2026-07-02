import datetime
from typing import Optional
from pydantic import BaseModel
from src.portfolio.schemas import FundDetail

class TransactionDetail(BaseModel):
    transaction_id: str
    fund: FundDetail
    type: str
    amount: float
    units: Optional[float] = None
    nav: Optional[float] = None
    status: str
    failure_reason: Optional[str] = None
    transaction_date: datetime.date

    class Config:
        from_attributes = True

class InvestRequest(BaseModel):
    fund_id: int
    amount: float
    bank_account: str
