import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationDetail(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
