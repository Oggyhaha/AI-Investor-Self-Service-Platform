from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from src.investors.models import Investor
from src.conversations.models import Conversation
from src.tickets.models import ServiceRequest
from src.analytics.schemas import DashboardMetrics, MetricItem, SeriesItem

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> DashboardMetrics:
        """Fetch dashboard analytics including total user counts, ticket states, and intent charts."""
        # 1. Total Investors
        inv_count_result = await self.db.execute(select(func.count(Investor.id)))
        total_investors = inv_count_result.scalar_one()

        # 2. Total Conversations
        conv_count_result = await self.db.execute(select(func.count(Conversation.id)))
        total_conversations = conv_count_result.scalar_one()

        # 3. Tickets Resolved
        resolved_tickets_result = await self.db.execute(
            select(func.count(ServiceRequest.id)).where(ServiceRequest.status.in_(["resolved", "closed"]))
        )
        tickets_resolved = resolved_tickets_result.scalar_one()

        # 4. AI Accuracy (Percentage of non-escalated conversations)
        escalated_conv_result = await self.db.execute(
            select(func.count(Conversation.id)).where(Conversation.status == "escalated")
        )
        escalated_conversations = escalated_conv_result.scalar_one()
        ai_accuracy = 100.0
        if total_conversations > 0:
            ai_accuracy = ((total_conversations - escalated_conversations) / total_conversations) * 100.0

        # 5. Intents breakdown
        intents_result = await self.db.execute(
            select(Conversation.primary_intent, func.count(Conversation.id))
            .where(Conversation.primary_intent.isnot(None))
            .group_by(Conversation.primary_intent)
        )
        intents_breakdown = [
            MetricItem(label=row[0], value=float(row[1]))
            for row in intents_result.all()
        ]

        # 6. Ticket Status Breakdown
        status_result = await self.db.execute(
            select(ServiceRequest.status, func.count(ServiceRequest.id))
            .group_by(ServiceRequest.status)
        )
        ticket_status_breakdown = [
            MetricItem(label=row[0], value=float(row[1]))
            for row in status_result.all()
        ]

        # 7. Conversations over time (aggregate last 7 days)
        # Fetch started_at from conversations
        history_result = await self.db.execute(
            select(Conversation.started_at)
            .order_by(Conversation.started_at.asc())
        )
        dates_count = {}
        for row in history_result.all():
            dt = row[0]
            if dt:
                date_str = dt.strftime("%Y-%m-%d")
                dates_count[date_str] = dates_count.get(date_str, 0) + 1
        
        conversations_over_time = [
            SeriesItem(date=d, value=v)
            for d, v in sorted(dates_count.items())
        ]

        return DashboardMetrics(
            total_investors=total_investors,
            total_conversations=total_conversations,
            tickets_resolved=tickets_resolved,
            ai_accuracy=round(ai_accuracy, 2),
            intents_breakdown=intents_breakdown,
            conversations_over_time=conversations_over_time,
            ticket_status_breakdown=ticket_status_breakdown
        )
