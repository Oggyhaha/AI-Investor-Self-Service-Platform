from typing import List, Dict
from pydantic import BaseModel

class MetricItem(BaseModel):
    label: str
    value: float

class SeriesItem(BaseModel):
    date: str
    value: int

class DashboardMetrics(BaseModel):
    total_investors: int
    total_conversations: int
    tickets_resolved: int
    ai_accuracy: float  # Percentage of conversations not escalated
    intents_breakdown: List[MetricItem]
    conversations_over_time: List[SeriesItem]
    ticket_status_breakdown: List[MetricItem]

class ConversationBriefWithMeta(BaseModel):
    conversation_id: str
    investor_name: str
    started_at: str
    primary_intent: str
    status: str
    messages_count: int
