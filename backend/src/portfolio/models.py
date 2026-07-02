import datetime
from sqlalchemy import String, Date, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class Fund(Base):
    __tablename__ = "funds"

    id: Mapped[int] = mapped_column(primary_key=True)
    fund_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    fund_name: Mapped[str] = mapped_column(String(300), nullable=False)
    fund_house: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # equity/debt/hybrid/elss
    sub_category: Mapped[str] = mapped_column(String(100), nullable=True)
    nav: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    nav_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)  # low/moderate/high
    expense_ratio: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    aum: Mapped[float] = mapped_column(Numeric(15, 2), nullable=True)  # in crores
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    holdings: Mapped[list["PortfolioHolding"]] = relationship("PortfolioHolding", back_populates="fund")
    sips: Mapped[list["SIP"]] = relationship("SIP", back_populates="fund")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="fund")

class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id: Mapped[int] = mapped_column(primary_key=True)
    investor_id: Mapped[int] = mapped_column(ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    fund_id: Mapped[int] = mapped_column(ForeignKey("funds.id"), nullable=False)
    units: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    invested_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    current_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    returns_pct: Mapped[float] = mapped_column(Numeric(8, 2), nullable=True)
    purchase_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    investor: Mapped["Investor"] = relationship("Investor", back_populates="holdings")
    fund: Mapped["Fund"] = relationship("Fund", back_populates="holdings")
