import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class ContactUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class InvestorProfile(BaseModel):
    investor_id: str
    full_name: str
    email: EmailStr
    phone: str
    pan: str
    date_of_birth: Optional[datetime.date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    risk_profile: str
    is_active: bool

    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    investor_profile: InvestorProfile
    total_invested: float
    current_value: float
    total_returns: float
    total_returns_pct: float
    active_sips_count: int
    pending_notifications_count: int
