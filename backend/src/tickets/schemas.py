import datetime
from typing import Optional, List
from pydantic import BaseModel

class NoteCreate(BaseModel):
    content: str

class NoteDetail(BaseModel):
    id: int
    author_type: str
    author_id: Optional[int] = None
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TicketBrief(BaseModel):
    id: int
    ticket_id: str
    category: str
    subject: str
    status: str
    priority: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    investor_name: str
    investor_phone: str

    class Config:
        from_attributes = True

class TicketDetail(BaseModel):
    id: int
    ticket_id: str
    category: str
    subject: str
    description: Optional[str] = None
    status: str
    priority: str
    ai_summary: Optional[str] = None
    resolution: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    investor_name: str
    investor_id: str
    advisor_name: Optional[str] = None
    notes: List[NoteDetail] = []

    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    resolution: Optional[str] = None
    advisor_id: Optional[int] = None
