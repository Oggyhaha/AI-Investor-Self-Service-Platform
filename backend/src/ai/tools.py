import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from src.investors.models import Investor
from src.portfolio.models import PortfolioHolding, Fund
from src.sip.models import SIP, Mandate
from src.kyc.models import KYC
from src.nominees.models import Nominee
from src.transactions.models import Transaction
from src.statements.models import Statement
from src.tickets.models import ServiceRequest, ServiceRequestNote
from src.conversations.models import Conversation, ConversationMessage
from src.notifications.models import Notification
from src.advisors.models import Advisor

class AIToolExecutor:
    """Executes database queries on behalf of the AI agent.

    All methods must return JSON-serializable dictionaries.
    """

    def __init__(self, db: AsyncSession, investor_db_id: int):
        self.db = db
        self.investor_db_id = investor_db_id

    async def get_investor_profile(self) -> Dict[str, Any]:
        """Fetch general investor details (name, email, PAN, address)."""
        result = await self.db.execute(select(Investor).where(Investor.id == self.investor_db_id))
        inv = result.scalars().first()
        if not inv:
            return {"error": "Investor not found"}
        return {
            "investor_id": inv.investor_id,
            "full_name": inv.full_name,
            "email": inv.email,
            "phone": inv.phone,
            "pan": inv.pan,
            "risk_profile": inv.risk_profile,
            "address": f"{inv.address or ''}, {inv.city or ''}, {inv.state or ''} - {inv.pincode or ''}"
        }

    async def get_portfolio_summary(self) -> Dict[str, Any]:
        """Fetch aggregate portfolio values (total invested, current value, absolute returns)."""
        result = await self.db.execute(
            select(PortfolioHolding).where(PortfolioHolding.investor_id == self.investor_db_id)
        )
        holdings = result.scalars().all()
        total_invested = float(sum(h.invested_amount for h in holdings))
        current_value = float(sum(h.current_value for h in holdings))
        absolute_returns = current_value - total_invested
        returns_pct = (absolute_returns / total_invested * 100) if total_invested > 0 else 0.0
        return {
            "total_invested": total_invested,
            "current_value": current_value,
            "absolute_returns": absolute_returns,
            "returns_pct": round(returns_pct, 2)
        }

    async def get_portfolio_holdings(self) -> Dict[str, Any]:
        """Fetch detailed mutual fund holdings breakdown."""
        result = await self.db.execute(
            select(PortfolioHolding)
            .where(PortfolioHolding.investor_id == self.investor_db_id)
        )
        holdings = result.scalars().all()
        data = []
        for h in holdings:
            fund_res = await self.db.execute(select(Fund).where(Fund.id == h.fund_id))
            fund = fund_res.scalars().first()
            data.append({
                "fund_name": fund.fund_name if fund else "Unknown Fund",
                "units": float(h.units),
                "invested_amount": float(h.invested_amount),
                "current_value": float(h.current_value),
                "returns_pct": float(h.returns_pct or 0.0)
            })
        return {"holdings": data}

    async def get_sip_list(self) -> Dict[str, Any]:
        """Fetch list of all SIPs, showing status and installment details."""
        result = await self.db.execute(
            select(SIP).where(SIP.investor_id == self.investor_db_id)
        )
        sips = result.scalars().all()
        data = []
        for s in sips:
            fund_res = await self.db.execute(select(Fund).where(Fund.id == s.fund_id))
            fund = fund_res.scalars().first()
            data.append({
                "sip_id": s.sip_id,
                "fund_name": fund.fund_name if fund else "Unknown Fund",
                "amount": float(s.amount),
                "frequency": s.frequency,
                "sip_date": s.sip_date,
                "status": s.status,
                "completed_installments": s.completed_installments
            })
        return {"sips": data}

    async def get_failed_sips(self) -> Dict[str, Any]:
        """Fetch failed SIP details with mandate status and bank failure reasons."""
        result = await self.db.execute(
            select(SIP).where(SIP.investor_id == self.investor_db_id, SIP.status == "failed")
        )
        sips = result.scalars().all()
        data = []
        for s in sips:
            fund_res = await self.db.execute(select(Fund).where(Fund.id == s.fund_id))
            fund = fund_res.scalars().first()
            
            mandate_res = await self.db.execute(select(Mandate).where(Mandate.sip_id == s.id))
            mandate = mandate_res.scalars().first()
            
            data.append({
                "sip_id": s.sip_id,
                "fund_name": fund.fund_name if fund else "Unknown Fund",
                "amount": float(s.amount),
                "status": s.status,
                "bank_name": mandate.bank_name if mandate else "Unknown Bank",
                "mandate_status": mandate.status if mandate else "No Mandate",
                "failure_reason": mandate.failure_reason if mandate else "No Failure Reason"
            })
        return {"failed_sips": data}

    async def get_kyc_status(self) -> Dict[str, Any]:
        """Fetch verification status checklist for KYC."""
        result = await self.db.execute(select(KYC).where(KYC.investor_id == self.investor_db_id))
        kyc = result.scalars().first()
        if not kyc:
            return {"kyc_status": "pending", "details": "No KYC checklist found"}
        return {
            "kyc_status": kyc.kyc_status,
            "kyc_type": kyc.kyc_type,
            "pan_verified": kyc.pan_verified,
            "aadhaar_verified": kyc.aadhaar_verified,
            "address_verified": kyc.address_verified,
            "photo_verified": kyc.photo_verified,
            "remarks": kyc.remarks
        }

    async def get_nominee_list(self) -> Dict[str, Any]:
        """Fetch registered nominee allocations and minor status."""
        result = await self.db.execute(
            select(Nominee).where(Nominee.investor_id == self.investor_db_id)
        )
        nominees = result.scalars().all()
        data = []
        for n in nominees:
            data.append({
                "nominee_name": n.nominee_name,
                "relationship": n.relationship,
                "allocation_pct": float(n.allocation_pct),
                "is_minor": n.is_minor,
                "guardian_name": n.guardian_name,
                "status": n.status
            })
        return {"nominees": data}

    async def get_recent_transactions(self) -> Dict[str, Any]:
        """Fetch transaction history details (limit 5)."""
        result = await self.db.execute(
            select(Transaction)
            .where(Transaction.investor_id == self.investor_db_id)
            .order_by(Transaction.transaction_date.desc())
            .limit(5)
        )
        txns = result.scalars().all()
        data = []
        for t in txns:
            fund_res = await self.db.execute(select(Fund).where(Fund.id == t.fund_id))
            fund = fund_res.scalars().first()
            data.append({
                "transaction_id": t.transaction_id,
                "fund_name": fund.fund_name if fund else "Unknown Fund",
                "type": t.type,
                "amount": float(t.amount),
                "status": t.status,
                "date": t.transaction_date.isoformat()
            })
        return {"transactions": data}

    async def create_kyc_reverification_ticket(self, full_name: str, dob: str, pan: str, aadhaar: str) -> Dict[str, Any]:
        """Create a service request ticket to update KYC information."""
        time_str = datetime.datetime.now().strftime("%y%m%d%H%M")
        ticket_id = f"TKT-KYC-{time_str}"
        description = f"KYC update request submitted.\nName: {full_name}\nDOB: {dob}\nPAN: {pan}\nAadhaar: {aadhaar}"
        
        ticket = ServiceRequest(
            ticket_id=ticket_id,
            investor_id=self.investor_db_id,
            category="kyc_update",
            subject="KYC Re-verification Request",
            description=description,
            status="open",
            priority="medium",
            ai_summary="AI generated service request for KYC re-verification."
        )
        self.db.add(ticket)
        await self.db.flush()
        return {
            "ticket_id": ticket_id,
            "message": "KYC update service request ticket created successfully. Support team will review."
        }

    async def create_nominee_change_ticket(self, nominee_name: str, relationship: str, dob: str, allocation_pct: float, guardian_name: str = "") -> Dict[str, Any]:
        """Create a service request ticket to register nominee changes."""
        time_str = datetime.datetime.now().strftime("%y%m%d%H%M")
        ticket_id = f"TKT-NOM-{time_str}"
        description = f"Nominee update request submitted.\nName: {nominee_name}\nRelationship: {relationship}\nDOB: {dob}\nAllocation: {allocation_pct}%\nGuardian: {guardian_name or 'N/A'}"
        
        ticket = ServiceRequest(
            ticket_id=ticket_id,
            investor_id=self.investor_db_id,
            category="nominee_change",
            subject="Nominee Update Request",
            description=description,
            status="open",
            priority="medium",
            ai_summary="AI generated service request for nominee update."
        )
        self.db.add(ticket)
        await self.db.flush()
        return {
            "ticket_id": ticket_id,
            "message": "Nominee change service request ticket created successfully. Support team will review."
        }

    async def generate_account_statement(self, statement_type: str, period_from: str, period_to: str) -> Dict[str, Any]:
        """Generate and record a mutual fund statement for download."""
        # Simple file-system mock generation
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        statements_dir = os.path.join(base_dir, "statements")
        os.makedirs(statements_dir, exist_ok=True)
        
        filename = f"stmt_{self.investor_db_id}_{statement_type}_{period_from}_to_{period_to}.txt"
        file_path = os.path.join(statements_dir, filename)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"ABC Mutual Fund Statement\nType: {statement_type}\nPeriod: {period_from} to {period_to}\n")
            f.write("Status: Generated Mock File\n")
            
        statement = Statement(
            investor_id=self.investor_db_id,
            statement_type=statement_type,
            period_from=datetime.datetime.strptime(period_from, "%Y-%m-%d").date(),
            period_to=datetime.datetime.strptime(period_to, "%Y-%m-%d").date(),
            file_path=file_path,
            status="generated"
        )
        self.db.add(statement)
        await self.db.flush()
        return {
            "statement_id": statement.id,
            "statement_type": statement.statement_type,
            "message": "Statement generated successfully. Use statements download section to fetch."
        }

    async def escalate_to_advisor(self, reason: str) -> Dict[str, Any]:
        """Escalate the conversation to a human support advisor."""
        time_str = datetime.datetime.now().strftime("%y%m%d%H%M")
        ticket_id = f"TKT-ESC-{time_str}"
        ticket = ServiceRequest(
            ticket_id=ticket_id,
            investor_id=self.investor_db_id,
            category="general",
            subject="Advisor Escalation Request",
            description=f"Escalation triggered by AI Assistant due to: {reason}",
            status="open",
            priority="high",
            ai_summary=f"Escalation requested. Reason: {reason}"
        )
        self.db.add(ticket)
        await self.db.flush()
        return {
            "ticket_id": ticket_id,
            "escalated": True,
            "message": "We have escalated this conversation to a human support advisor. They will be with you shortly."
        }

import os
