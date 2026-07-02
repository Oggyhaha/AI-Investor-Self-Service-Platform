from typing import Sequence, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.conversations.models import Conversation, ConversationMessage

class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, session: AsyncSession):
        super().__init__(Conversation, session)

    async def get_by_uuid(self, conversation_id: str) -> Optional[Conversation]:
        """Fetch conversation by conversation_id UUID, eagerly loading messages."""
        result = await self.session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.conversation_id == conversation_id)
        )
        return result.scalars().first()

    async def get_by_investor(self, investor_id: int) -> Sequence[Conversation]:
        """Fetch all conversations initiated by an investor."""
        result = await self.session.execute(
            select(Conversation)
            .where(Conversation.investor_id == investor_id)
            .order_by(Conversation.started_at.desc())
        )
        return result.scalars().all()
