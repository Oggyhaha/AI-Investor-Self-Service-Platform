import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class MessageRequest(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime.datetime
    intent: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ConversationBrief(BaseModel):
    conversation_id: str
    status: str
    started_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    summary: Optional[str] = None
    primary_intent: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationDetail(ConversationBrief):
    messages: List[MessageResponse]

    class Config:
        from_attributes = True

class ConversationRateRequest(BaseModel):
    rating: int
