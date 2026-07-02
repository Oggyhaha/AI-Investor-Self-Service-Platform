import datetime
from typing import Optional
from pydantic import BaseModel
from src.portfolio.schemas import FundDetail

class MandateDetail(BaseModel):
    mandate_id: str
    bank_name: str
    account_number: str
    mandate_type: str
    max_amount: float
    status: str
    failure_reason: Optional[str] = None
    valid_from: Optional[datetime.date] = None
    valid_until: Optional[datetime.date] = None

    class Config:
        from_attributes = True

class SIPDetail(BaseModel):
    sip_id: str
    fund: FundDetail
    amount: float
    frequency: str
    sip_date: int
    start_date: datetime.date
    end_date: Optional[datetime.date] = None
    status: str
    next_due_date: Optional[datetime.date] = None
    total_installments: Optional[int] = None
    completed_installments: int
    mandate: Optional[MandateDetail] = None

    class Config:
        from_attributes = True
