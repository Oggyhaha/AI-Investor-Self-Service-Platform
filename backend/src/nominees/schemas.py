import datetime
from typing import Optional
from pydantic import BaseModel

class NomineeDetail(BaseModel):
    id: int
    nominee_name: str
    relationship: str
    date_of_birth: Optional[datetime.date] = None
    allocation_pct: float
    is_minor: bool
    guardian_name: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class NomineeUpdateRequest(BaseModel):
    nominee_name: str
    relationship: str
    date_of_birth: str  # YYYY-MM-DD
    allocation_pct: float
    guardian_name: Optional[str] = None
