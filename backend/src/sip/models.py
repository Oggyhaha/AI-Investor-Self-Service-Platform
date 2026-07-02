import datetime
from sqlalchemy import String, Date, Numeric, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class SIP(Base):
    __tablename__ = "sips"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    fund_id: Mapped[int] = mapped_column(ForeignKey("funds.id"), nullable=False)
    sip_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # e.g., "SIP-50001"
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    frequency: Mapped[str] = mapped_column(String(20), default="monthly")  # monthly/quarterly
    sip_date: Mapped[int] = mapped_column(Integer, nullable=False)  # day of month (1-28)
    start_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active/paused/completed/failed
    next_due_date: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    total_installments: Mapped[int] = mapped_column(Integer, nullable=True)
    completed_installments: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    investor: Mapped["Investor"] = relationship("Investor", back_populates="sips")
    fund: Mapped["Fund"] = relationship("Fund", back_populates="sips")
    mandate: Mapped["Mandate"] = relationship("Mandate", back_populates="sip", uselist=False, cascade="all, delete-orphan")

class Mandate(Base):
    __tablename__ = "mandates"

    id: Mapped[int] = mapped_column(primary_key=True)
    sip_id: Mapped[int] = mapped_column(ForeignKey("sips.id", ondelete="CASCADE"), nullable=False)
    mandate_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)  # e.g., "MND-70001"
    bank_name: Mapped[str] = mapped_column(String(200), nullable=False)
    account_number: Mapped[str] = mapped_column(String(20), nullable=False)
    mandate_type: Mapped[str] = mapped_column(String(20), default="e-mandate")  # e-mandate/physical/nach
    max_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active/pending/rejected/expired
    failure_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    valid_from: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    valid_until: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    sip: Mapped["SIP"] = relationship("SIP", back_populates="mandate")
