import datetime
from sqlalchemy import String, Date, Boolean, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class KYC(Base):
    __tablename__ = "kyc"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), unique=True, nullable=False)
    kyc_status: Mapped[str] = mapped_column(String(20), default="pending")  # verified/pending/rejected/expired
    kyc_type: Mapped[str] = mapped_column(String(20), nullable=True)  # e-kyc/ckyc/physical
    aadhaar_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    pan_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    address_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_date: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    investor: Mapped["Investor"] = relationship("Investor", back_populates="kyc")
