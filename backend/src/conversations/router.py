from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_db
from src.auth.dependencies import get_current_investor
from src.investors.models import Investor
from src.conversations.schemas import ConversationBrief, ConversationDetail, MessageResponse, MessageRequest, ConversationRateRequest
from src.conversations.service import ConversationService

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.post("", response_model=ConversationBrief)
async def start_chat(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Start a new chat conversation session with the AURA AI assistant."""
    service = ConversationService(db)
    return await service.start_conversation(current_investor.id)

@router.get("", response_model=List[ConversationBrief])
async def list_chats(
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve history of all conversations started by the logged-in investor."""
    service = ConversationService(db)
    return await service.get_conversations(current_investor.id)

@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_chat_detail(
    conversation_id: str,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details of a specific conversation ID, including full historical message logs."""
    service = ConversationService(db)
    return await service.get_conversation_detail(current_investor.id, conversation_id)

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_chat_message(
    conversation_id: str,
    request: MessageRequest,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Send a user message, run the AI conversation orchestration, and receive the assistant's reply."""
    service = ConversationService(db)
    return await service.send_message(current_investor.id, conversation_id, request)

@router.post("/{conversation_id}/close")
async def close_chat(
    conversation_id: str,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Mark an active conversation session as closed."""
    service = ConversationService(db)
    return await service.close_conversation(current_investor.id, conversation_id)

@router.post("/{conversation_id}/rate")
async def rate_chat(
    conversation_id: str,
    request: ConversationRateRequest,
    current_investor: Investor = Depends(get_current_investor),
    db: AsyncSession = Depends(get_db),
):
    """Rate conversation satisfaction (score from 1 to 5)."""
    service = ConversationService(db)
    return await service.rate_conversation(current_investor.id, conversation_id, request.rating)
