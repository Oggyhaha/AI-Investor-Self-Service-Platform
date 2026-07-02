import asyncio
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from src.core.database import init_db, async_session_factory, engine
from src.core.security import hash_password
from src.investors.models import Investor
from src.advisors.models import Advisor
from src.portfolio.models import Fund, PortfolioHolding
from src.sip.models import SIP, Mandate
from src.kyc.models import KYC
from src.nominees.models import Nominee
from src.transactions.models import Transaction
from src.notifications.models import Notification
from src.conversations.models import Conversation, ConversationMessage
from src.tickets.models import ServiceRequest
from src.statements.models import Statement


async def ensure_database_exists():
    from src.core.config import get_settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
    
    settings = get_settings()
    db_url = settings.database_url
    
    # Clean the connection string to remove unsupported parameters
    if db_url.startswith("postgresql"):
        try:
            parsed = urlparse(db_url)
            query_params = parse_qs(parsed.query)
            query_params.pop("channel_binding", None)
            if "sslmode" in query_params:
                sslmode = query_params.pop("sslmode")[0]
                if sslmode in ["require", "verify-ca", "verify-full"]:
                    query_params["ssl"] = ["require"]
            new_query = urlencode(query_params, doseq=True)
            db_url = urlunparse(parsed._replace(query=new_query))
        except Exception:
            pass

    # Only need to create database if it is PostgreSQL
    if db_url.startswith("postgresql"):
        # Split database name from base URI
        base_url, db_name = db_url.rsplit("/", 1)
        if "?" in db_name:
            db_name_clean, query_params = db_name.split("?", 1)
            postgres_url = f"{base_url}/postgres?{query_params}"
        else:
            db_name_clean = db_name
            postgres_url = f"{base_url}/postgres"
            
        print(f"Checking if database '{db_name_clean}' exists...")
        temp_engine = create_async_engine(postgres_url, isolation_level="AUTOCOMMIT")
        async with temp_engine.connect() as conn:
            res = await conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname='{db_name_clean}'")
            )
            exists = res.scalar()
            if not exists:
                print(f"Database '{db_name_clean}' does not exist. Creating database...")
                await conn.execute(text(f"CREATE DATABASE {db_name_clean}"))
                print(f"Database '{db_name_clean}' created successfully.")
            else:
                print(f"Database '{db_name_clean}' already exists.")
        await temp_engine.dispose()

async def seed():
    # 0. Ensure target database exists in Postgres
    await ensure_database_exists()
    
    # 1. Ensure tables are created
    await init_db()

    async with async_session_factory() as session:
        # Check if already seeded
        res = await session.execute(select(Investor).limit(1))
        if res.scalars().first():
            print("Database already contains data. Seeding skipped.")
            return

        print("Seeding database...")

        # 2. Seed Advisors & Admins
        advisor_pwd = hash_password("advisor123")
        admin_pwd = hash_password("admin123")
        
        sneha = Advisor(
            advisor_id="ADV-001",
            full_name="Sneha Gupta",
            email="sneha@abcmf.com",
            phone="9988776655",
            department="Customer Support",
            is_available=True,
            hashed_password=advisor_pwd,
            role="advisor"
        )
        vikram = Advisor(
            advisor_id="ADV-002",
            full_name="Vikram Singh",
            email="vikram@abcmf.com",
            phone="9988776656",
            department="Operations",
            is_available=True,
            hashed_password=admin_pwd,
            role="admin"
        )
        session.add_all([sneha, vikram])
        await session.flush()

        # 3. Seed Investors
        investor_pwd = hash_password("123456")  # Hardcoded OTP for login is '123456'
        
        rajesh = Investor(
            investor_id="INV-10001",
            full_name="Rajesh Kumar Sharma",
            email="rajesh@example.com",
            phone="9876543210",
            pan="ABCPS1234A",
            date_of_birth=datetime.date(1985, 5, 15),
            address="A-404, Shanti Nagar",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            risk_profile="moderate",
            is_active=True,
            hashed_password=investor_pwd
        )
        priya = Investor(
            investor_id="INV-10002",
            full_name="Priya Mehta",
            email="priya@example.com",
            phone="9876543211",
            pan="DEFPM5678B",
            date_of_birth=datetime.date(1992, 9, 20),
            address="Flat 12B, Rose Gardens",
            city="Bengaluru",
            state="Karnataka",
            pincode="560008",
            risk_profile="aggressive",
            is_active=True,
            hashed_password=investor_pwd
        )
        amit = Investor(
            investor_id="INV-10003",
            full_name="Amit Patel",
            email="amit@example.com",
            phone="9876543212",
            pan="GHIAP9012C",
            date_of_birth=datetime.date(1978, 12, 10),
            address="72, Vasant Kunj",
            city="New Delhi",
            state="Delhi",
            pincode="110070",
            risk_profile="conservative",
            is_active=True,
            hashed_password=investor_pwd
        )
        session.add_all([rajesh, priya, amit])
        await session.flush()

        # 4. Seed KYC Checklist
        kyc_rajesh = KYC(
            investor_id=rajesh.id,
            kyc_status="verified",
            kyc_type="e-kyc",
            aadhaar_verified=True,
            pan_verified=True,
            address_verified=True,
            photo_verified=True,
            verification_date=datetime.date(2025, 1, 15),
            remarks="Completed successfully online via Aadhaar OTP authentication."
        )
        kyc_priya = KYC(
            investor_id=priya.id,
            kyc_status="pending",
            kyc_type="physical",
            aadhaar_verified=False,
            pan_verified=True,
            address_verified=False,
            photo_verified=False,
            remarks="Aadhaar linking pending and photo verification required."
        )
        kyc_amit = KYC(
            investor_id=amit.id,
            kyc_status="verified",
            kyc_type="ckyc",
            aadhaar_verified=True,
            pan_verified=True,
            address_verified=True,
            photo_verified=True,
            verification_date=datetime.date(2024, 6, 10),
            remarks="Verified from Central KYC registry database."
        )
        session.add_all([kyc_rajesh, kyc_priya, kyc_amit])
        await session.flush()

        # 5. Seed Mutual Funds
        hdfc_mid = Fund(
            fund_code="HDFC-MID-001",
            fund_name="HDFC Mid-Cap Opportunities Fund",
            fund_house="HDFC Mutual Fund",
            category="equity",
            sub_category="mid-cap",
            nav=425.67,
            nav_date=datetime.date.today(),
            risk_level="high",
            expense_ratio=0.85,
            aum=45000.00
        )
        icici_blue = Fund(
            fund_code="ICICI-BLUE-001",
            fund_name="ICICI Prudential Bluechip Fund",
            fund_house="ICICI Prudential Mutual Fund",
            category="equity",
            sub_category="large-cap",
            nav=89.34,
            nav_date=datetime.date.today(),
            risk_level="moderate",
            expense_ratio=0.72,
            aum=52000.00
        )
        sbi_small = Fund(
            fund_code="SBI-SMALL-001",
            fund_name="SBI Small Cap Fund",
            fund_house="SBI Mutual Fund",
            category="equity",
            sub_category="small-cap",
            nav=156.78,
            nav_date=datetime.date.today(),
            risk_level="high",
            expense_ratio=0.91,
            aum=28000.00
        )
        axis_elss = Fund(
            fund_code="AXIS-ELSS-001",
            fund_name="Axis Long Term Equity Fund (ELSS)",
            fund_house="Axis Mutual Fund",
            category="elss",
            sub_category="tax-saving",
            nav=78.23,
            nav_date=datetime.date.today(),
            risk_level="high",
            expense_ratio=0.78,
            aum=34000.00
        )
        kotak_multi = Fund(
            fund_code="KOTAK-MULTI-001",
            fund_name="Kotak Standard Multicap Fund",
            fund_house="Kotak Mutual Fund",
            category="equity",
            sub_category="multi-cap",
            nav=62.45,
            nav_date=datetime.date.today(),
            risk_level="moderate",
            expense_ratio=0.81,
            aum=41000.00
        )
        nippon_liq = Fund(
            fund_code="NIPPON-LIQ-001",
            fund_name="Nippon India Liquid Fund",
            fund_house="Nippon India Mutual Fund",
            category="debt",
            sub_category="liquid",
            nav=5234.12,
            nav_date=datetime.date.today(),
            risk_level="low",
            expense_ratio=0.25,
            aum=22000.00
        )
        session.add_all([hdfc_mid, icici_blue, sbi_small, axis_elss, kotak_multi, nippon_liq])
        await session.flush()

        # 6. Seed Portfolio Holdings
        # Rajesh Holdings
        h1 = PortfolioHolding(
            investor_id=rajesh.id, fund_id=hdfc_mid.id, units=234.92,
            invested_amount=80000.0, current_value=99998.42, returns_pct=24.99,
            purchase_date=datetime.date(2024, 2, 10)
        )
        h2 = PortfolioHolding(
            investor_id=rajesh.id, fund_id=icici_blue.id, units=1678.98,
            invested_amount=130000.0, current_value=149999.07, returns_pct=15.38,
            purchase_date=datetime.date(2024, 5, 20)
        )
        h3 = PortfolioHolding(
            investor_id=rajesh.id, fund_id=nippon_liq.id, units=9.55,
            invested_amount=50000.0, current_value=49985.84, returns_pct=-0.02,
            purchase_date=datetime.date(2025, 1, 15)
        )
        
        # Priya Holdings (Aggressive)
        h4 = PortfolioHolding(
            investor_id=priya.id, fund_id=sbi_small.id, units=1913.51,
            invested_amount=250000.0, current_value=300000.09, returns_pct=20.00,
            purchase_date=datetime.date(2023, 11, 5)
        )
        h5 = PortfolioHolding(
            investor_id=priya.id, fund_id=hdfc_mid.id, units=352.38,
            invested_amount=120000.0, current_value=150007.59, returns_pct=25.01,
            purchase_date=datetime.date(2024, 4, 15)
        )

        # Amit Holdings (Conservative)
        h6 = PortfolioHolding(
            investor_id=amit.id, fund_id=nippon_liq.id, units=76.42,
            invested_amount=400000.0, current_value=399991.45, returns_pct=-0.00,
            purchase_date=datetime.date(2024, 8, 12)
        )
        session.add_all([h1, h2, h3, h4, h5, h6])
        await session.flush()

        # 7. Seed SIPs & Mandates
        # Rajesh active SIP
        sip_raj1 = SIP(
            investor_id=rajesh.id, fund_id=hdfc_mid.id, sip_id="SIP-50001",
            amount=5000.00, frequency="monthly", sip_date=10,
            start_date=datetime.date(2024, 3, 1), status="active",
            next_due_date=datetime.date.today() + datetime.timedelta(days=15),
            total_installments=36, completed_installments=16
        )
        # Rajesh failed SIP
        sip_raj2 = SIP(
            investor_id=rajesh.id, fund_id=icici_blue.id, sip_id="SIP-50002",
            amount=10000.00, frequency="monthly", sip_date=15,
            start_date=datetime.date(2024, 6, 1), status="failed",
            next_due_date=datetime.date(2026, 7, 15),
            total_installments=24, completed_installments=12
        )
        session.add_all([sip_raj1, sip_raj2])
        await session.flush()

        m_raj1 = Mandate(
            sip_id=sip_raj1.id, mandate_id="MND-70001", bank_name="HDFC Bank",
            account_number="******1234", mandate_type="e-mandate",
            max_amount=15000.00, status="active", valid_from=datetime.date(2024, 3, 1)
        )
        m_raj2 = Mandate(
            sip_id=sip_raj2.id, mandate_id="MND-70002", bank_name="ICICI Bank",
            account_number="******5678", mandate_type="e-mandate",
            max_amount=20000.00, status="failed",
            failure_reason="Insufficient balance in bank account",
            valid_from=datetime.date(2024, 6, 1)
        )
        session.add_all([m_raj1, m_raj2])
        await session.flush()

        # Priya active SIP
        sip_pri1 = SIP(
            investor_id=priya.id, fund_id=sbi_small.id, sip_id="SIP-50003",
            amount=15000.00, frequency="monthly", sip_date=5,
            start_date=datetime.date(2023, 12, 1), status="active",
            next_due_date=datetime.date.today() + datetime.timedelta(days=10),
            total_installments=48, completed_installments=31
        )
        session.add(sip_pri1)
        await session.flush()

        m_pri1 = Mandate(
            sip_id=sip_pri1.id, mandate_id="MND-70003", bank_name="State Bank of India",
            account_number="******9012", mandate_type="nach",
            max_amount=50000.00, status="active", valid_from=datetime.date(2023, 12, 1)
        )
        session.add(m_pri1)
        await session.flush()

        # 8. Seed Nominees
        nom_raj = Nominee(
            investor_id=rajesh.id, nominee_name="Sunita Sharma",
            relationship="Spouse", date_of_birth=datetime.date(1987, 8, 12),
            allocation_pct=100.00, is_minor=False, status="active"
        )
        nom_pri = Nominee(
            investor_id=priya.id, nominee_name="Karan Mehta",
            relationship="Son", date_of_birth=datetime.date(2018, 4, 25),
            allocation_pct=100.00, is_minor=True, guardian_name="Priya Mehta",
            status="active"
        )
        session.add_all([nom_raj, nom_pri])
        await session.flush()

        # 9. Seed Transactions
        t1 = Transaction(
            investor_id=rajesh.id, fund_id=hdfc_mid.id, transaction_id="TXN-30001",
            type="purchase", amount=80000.00, units=234.92, nav=340.54, status="completed",
            transaction_date=datetime.date(2024, 2, 10)
        )
        t2 = Transaction(
            investor_id=rajesh.id, fund_id=icici_blue.id, transaction_id="TXN-30002",
            type="purchase", amount=130000.00, units=1678.98, nav=77.42, status="completed",
            transaction_date=datetime.date(2024, 5, 20)
        )
        t3 = Transaction(
            investor_id=rajesh.id, fund_id=icici_blue.id, transaction_id="TXN-30003",
            type="sip", amount=10000.00, status="failed", failure_reason="Insufficient balance",
            transaction_date=datetime.date(2025, 5, 15)
        )
        session.add_all([t1, t2, t3])
        await session.flush()

        # 10. Seed Notifications
        n1 = Notification(
            investor_id=rajesh.id, title="SIP Mandate Failure",
            message="Your HDFC Mid-Cap Opportunities Fund SIP transaction of ₹10,000 failed on May 15 due to insufficient balance in your ICICI bank account.",
            type="sip_reminder", is_read=False, link="/sips"
        )
        n2 = Notification(
            investor_id=rajesh.id, title="KYC Verification Successful",
            message="Congratulations! Your online KYC documents validation has been successfully verified.",
            type="kyc_expiry", is_read=True, link="/kyc"
        )
        n3 = Notification(
            investor_id=priya.id, title="KYC Verification Pending",
            message="Your KYC documents verification is pending. Please review Aadhaar linkages and upload documents.",
            type="kyc_expiry", is_read=False, link="/kyc"
        )
        session.add_all([n1, n2, n3])
        await session.flush()

        # 11. Seed Conversations
        c_raj = Conversation(
            conversation_id="conv-raj-001", investor_id=rajesh.id,
            status="active", channel="web",
            started_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1),
            primary_intent="CHECK_SIP"
        )
        session.add(c_raj)
        await session.flush()

        msg1 = ConversationMessage(
            conversation_id=c_raj.id, role="user",
            content="Why did my last ICICI SIP transaction fail?"
        )
        msg2 = ConversationMessage(
            conversation_id=c_raj.id, role="assistant",
            content="I can see your SIP transaction of ₹10,000 for ICICI Prudential Bluechip Fund failed on May 15th. The reason provided by your bank (ICICI Bank, account ending in 5678) was 'Insufficient balance in bank account'. Would you like me to create an advisor ticket to investigate or check other SIPs?",
            intent="CHECK_SIP"
        )
        session.add_all([msg1, msg2])
        await session.flush()

        # 12. Seed Support Ticket
        ticket1 = ServiceRequest(
            ticket_id="TKT-90001", investor_id=rajesh.id,
            advisor_id=sneha.id, conversation_id=c_raj.id,
            category="sip_failure", subject="SIP mandate transaction failed repeatedly",
            description="Rajesh's SIP transaction failed on May 15 due to insufficient balance. Requires human callback to update mandate limits or coordinate bank details.",
            status="open", priority="high",
            ai_summary="Investor contacted assistant regarding HDFC/ICICI SIP mandate failure. Assistant checked database and found bank return code was insufficient balance. Escalated to support advisor."
        )
        session.add(ticket1)
        await session.flush()

        # Commit everything
        await session.commit()
        print("Database successfully seeded with realistic mutual fund datasets.")

if __name__ == "__main__":
    # Setup loop and execute
    asyncio.run(seed())
