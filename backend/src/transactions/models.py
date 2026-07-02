import datetime
from sqlalchemy import String, Date, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    fund_id: Mapped[int] = mapped_column(ForeignKey("funds.id"), nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # purchase/redemption/sip/switch/dividend
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    units: Mapped[float] = mapped_column(Numeric(15, 4), nullable=True)
    nav: Mapped[float] = mapped_column(Numeric(12, 4), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="completed")  # completed/pending/failed/reversed
    failure_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    transaction_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    investor: Mapped["Investor"] = relationship("Investor", back_populates="transactions")
    fund: Mapped["Fund"] = relationship("Fund", back_populates="transactions")
