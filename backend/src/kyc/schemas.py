import datetime
from typing import Optional
from pydantic import BaseModel

class KYCStatus(BaseModel):
    kyc_status: str
    kyc_type: Optional[str] = None
    aadhaar_verified: bool
    pan_verified: bool
    address_verified: bool
    photo_verified: bool
    verification_date: Optional[datetime.date] = None
    expiry_date: Optional[datetime.date] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class KYCUpdateRequest(BaseModel):
    aadhaar_number: str
    pan_number: str
    full_name: str
    dob: str
