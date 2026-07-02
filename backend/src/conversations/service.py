import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from src.core.exceptions import NotFoundError, ForbiddenError
from src.conversations.repository import ConversationRepository
from src.conversations.models import Conversation, ConversationMessage
from src.conversations.schemas import ConversationBrief, ConversationDetail, MessageResponse, MessageRequest
from src.ai.engine import GeminiConversationEngine
from src.ai.tools import AIToolExecutor
from src.tickets.models import ServiceRequest

class ConversationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ConversationRepository(db)
        self.ai_engine = GeminiConversationEngine()

    async def start_conversation(self, investor_db_id: int) -> ConversationBrief:
        """Create and persist a new conversation session."""
        conversation_uuid = str(uuid.uuid4())
        conversation = Conversation(
            conversation_id=conversation_uuid,
            investor_id=investor_db_id,
            status="active",
            channel="web",
            started_at=datetime.datetime.now(datetime.timezone.utc)
        )
        await self.repo.add(conversation)
        
        # Add system welcome message
        welcome_msg = ConversationMessage(
            conversation=conversation,
            role="assistant",
            content="Hello! I am AURA, your virtual investor self-service platform. How can I help you today?",
            intent="GENERAL_FAQ"
        )
        self.db.add(welcome_msg)
        await self.db.flush()

        return ConversationBrief.model_validate(conversation)

    async def get_conversations(self, investor_db_id: int) -> List[ConversationBrief]:
        """Fetch all conversation sessions for an investor."""
        conversations = await self.repo.get_by_investor(investor_db_id)
        return [ConversationBrief.model_validate(c) for c in conversations]

    async def get_conversation_detail(self, investor_db_id: int, conversation_id: str) -> ConversationDetail:
        """Fetch a specific conversation session with message history logs."""
        conv = await self.repo.get_by_uuid(conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if conv.investor_id != investor_db_id:
            raise ForbiddenError("Access to this conversation is forbidden")
        return ConversationDetail.model_validate(conv)

    async def send_message(self, investor_db_id: int, conversation_id: str, request: MessageRequest) -> MessageResponse:
        """Send a user message, run the AI conversation loop, and log the response."""
        conv = await self.repo.get_by_uuid(conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if conv.investor_id != investor_db_id:
            raise ForbiddenError("Access to this conversation is forbidden")

        # 1. Save user message to database
        user_msg = ConversationMessage(
            conversation_id=conv.id,
            role="user",
            content=request.content
        )
        self.db.add(user_msg)
        await self.db.flush()

        # 2. Re-load full message history to pass to AI engine
        # Get all messages sorted by date
        history_result = await self.db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conv.id)
            .order_by(ConversationMessage.created_at.asc())
        )
        history_messages = history_result.scalars().all()
        
        ai_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages
        ]

        # 3. Execute AI response processing
        executor = AIToolExecutor(self.db, investor_db_id)
        ai_result = await self.ai_engine.chat(ai_history, executor)

        # 4. Process escalations or ticket generations
        meta = ai_result.get("metadata")
        is_escalated = False
        ticket_created_id = None
        
        if meta and meta.get("tool_called") == "escalate_to_advisor":
            is_escalated = True
            ticket_created_id = meta.get("tool_result", {}).get("ticket_id")

        # Link ticket to this conversation if a ticket was created
        if meta and "ticket_id" in str(meta.get("tool_result", {})):
            t_id = meta.get("tool_result", {}).get("ticket_id")
            if t_id:
                # Update ticket with this conversation database ID
                await self.db.execute(
                    update(ServiceRequest)
                    .where(ServiceRequest.ticket_id == t_id)
                    .values(conversation_id=conv.id)
                )

        # 5. Save AI assistant message to database
        ai_msg = ConversationMessage(
            conversation_id=conv.id,
            role="assistant",
            content=ai_result["content"],
            intent=ai_result["intent"],
            metadata_json=meta
        )
        self.db.add(ai_msg)

        # Update conversation status if escalated
        if is_escalated:
            conv.status = "escalated"
        conv.primary_intent = ai_result["intent"]
        
        # Save updates
        await self.repo.update(conv)
        await self.db.flush()
        await self.db.refresh(ai_msg)

        return MessageResponse.model_validate(ai_msg)

    async def close_conversation(self, investor_db_id: int, conversation_id: str) -> dict:
        """Close an active conversation session."""
        conv = await self.repo.get_by_uuid(conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if conv.investor_id != investor_db_id:
            raise ForbiddenError("Access to this conversation is forbidden")

        conv.status = "closed"
        conv.ended_at = datetime.datetime.now(datetime.timezone.utc)
        await self.repo.update(conv)
        return {"success": True, "message": "Conversation closed successfully"}

    async def rate_conversation(self, investor_db_id: int, conversation_id: str, rating: int) -> dict:
        """Rate a conversation (1 to 5)."""
        conv = await self.repo.get_by_uuid(conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")
        if conv.investor_id != investor_db_id:
            raise ForbiddenError("Access to this conversation is forbidden")

        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")

        conv.satisfaction_rating = rating
        await self.repo.update(conv)
        return {"success": True, "message": f"Rating of {rating} submitted successfully"}
