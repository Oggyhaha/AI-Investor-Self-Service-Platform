import datetime
from sqlalchemy import String, Date, Text, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class Investor(Base):
    __tablename__ = "investors"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    pan: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    date_of_birth: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str] = mapped_column(String(10), nullable=True)
    risk_profile: Mapped[str] = mapped_column(String(20), default="moderate")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    holdings: Mapped[list["PortfolioHolding"]] = relationship("PortfolioHolding", back_populates="investor", cascade="all, delete-orphan")
    sips: Mapped[list["SIP"]] = relationship("SIP", back_populates="investor", cascade="all, delete-orphan")
    kyc: Mapped["KYC"] = relationship("KYC", back_populates="investor", uselist=False, cascade="all, delete-orphan")
    nominees: Mapped[list["Nominee"]] = relationship("Nominee", back_populates="investor", cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="investor", cascade="all, delete-orphan")
    statements: Mapped[list["Statement"]] = relationship("Statement", back_populates="investor", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="investor", cascade="all, delete-orphan")
    tickets: Mapped[list["ServiceRequest"]] = relationship("ServiceRequest", back_populates="investor", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="investor", cascade="all, delete-orphan")
