import datetime
from typing import Optional, List
from pydantic import BaseModel

class FundDetail(BaseModel):
    fund_code: str
    fund_name: str
    fund_house: str
    category: str
    sub_category: Optional[str] = None
    nav: float
    nav_date: datetime.date
    risk_level: Optional[str] = None
    expense_ratio: Optional[float] = None
    aum: Optional[float] = None

    class Config:
        from_attributes = True

class HoldingDetail(BaseModel):
    id: int
    fund: FundDetail
    units: float
    invested_amount: float
    current_value: float
    returns_pct: Optional[float] = None
    purchase_date: datetime.date

    class Config:
        from_attributes = True

class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    absolute_returns: float
    returns_pct: float
    holdings: List[HoldingDetail]
