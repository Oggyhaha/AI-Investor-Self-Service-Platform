import datetime
from sqlalchemy import String, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class Statement(Base):
    __tablename__ = "statements"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    statement_type: Mapped[str] = mapped_column(String(30), nullable=False)  # account/capital_gains/transaction/holding
    period_from: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    period_to: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), default="generated")  # generated/pending/failed

    # Relationships
    investor: Mapped["Investor"] = relationship("Investor", back_populates="statements")
