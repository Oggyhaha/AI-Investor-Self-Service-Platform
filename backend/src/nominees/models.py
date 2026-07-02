import datetime
from sqlalchemy import String, Date, Numeric, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship
from src.core.database import Base

class Nominee(Base):
    __tablename__ = "nominees"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    nominee_name: Mapped[str] = mapped_column(String(200), nullable=False)
    relationship: Mapped[str] = mapped_column(String(50), nullable=False)
    date_of_birth: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=100.00)
    is_minor: Mapped[bool] = mapped_column(Boolean, default=False)
    guardian_name: Mapped[str] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active/pending_update/removed
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    investor: Mapped["Investor"] = orm_relationship("Investor", back_populates="nominees")


