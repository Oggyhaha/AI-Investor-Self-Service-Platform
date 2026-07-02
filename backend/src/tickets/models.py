import datetime
from sqlalchemy import String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # e.g., "TKT-90001"
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    advisor_id: Mapped[int] = mapped_column(ForeignKey("advisors.id"), nullable=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # sip_failure/kyc_update/nominee_change/general
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open/in_progress/resolved/closed
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low/medium/high/critical
    ai_summary: Mapped[str] = mapped_column(Text, nullable=True)
    resolution: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    resolved_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    investor: Mapped["Investor"] = relationship("Investor", back_populates="tickets")
    advisor: Mapped["Advisor"] = relationship("Advisor", back_populates="tickets")
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="tickets")
    notes: Mapped[list["ServiceRequestNote"]] = relationship("ServiceRequestNote", back_populates="ticket", cascade="all, delete-orphan")

class ServiceRequestNote(Base):
    __tablename__ = "service_request_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    author_type: Mapped[str] = mapped_column(String(20), nullable=False)  # advisor/system/ai
    author_id: Mapped[int] = mapped_column(ForeignKey("advisors.id"), nullable=True)  # References advisor if advisor is author
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ticket: Mapped["ServiceRequest"] = relationship("ServiceRequest", back_populates="notes")
