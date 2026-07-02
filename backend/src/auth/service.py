from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
import random
import datetime
from src.kyc.models import KYC

from src.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    decode_token,
)
from src.core.exceptions import BadRequestError, UnauthorizedError, NotFoundError, ConflictError
from src.investors.models import Investor
from src.advisors.models import Advisor
from src.auth.schemas import (
    LoginRequest,
    OTPVerifyRequest,
    AdvisorLoginRequest,
    TokenResponse,
    TokenRefreshRequest,
    SignupRequest,
)

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def initiate_otp_login(self, request: LoginRequest) -> dict:
        """Mock initiate OTP login. Verify if the investor exists by phone."""
        result = await self.db.execute(
            select(Investor).where(Investor.phone == request.phone)
        )
        investor = result.scalars().first()
        if not investor:
            raise NotFoundError("Investor phone number not registered")
        
        # In a real app, send OTP via SMS. For demo, we return success and expect "123456"
        return {"success": True, "message": "OTP sent successfully (mock OTP is 123456)"}

    async def verify_otp_login(self, request: OTPVerifyRequest) -> TokenResponse:
        """Verify the mock OTP and generate JWT tokens."""
        if request.otp != "123456":
            raise BadRequestError("Invalid OTP. For demo use 123456.")
        
        result = await self.db.execute(
            select(Investor).where(Investor.phone == request.phone)
        )
        investor = result.scalars().first()
        if not investor:
            raise NotFoundError("Investor not found")
        
        access_token = create_access_token(subject=investor.investor_id, role="investor")
        refresh_token = create_refresh_token(subject=investor.investor_id, role="investor")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            role="investor",
            user_id=investor.investor_id,
        )

    async def login_advisor(self, request: AdvisorLoginRequest) -> TokenResponse:
        """Authenticate advisor with email and password."""
        result = await self.db.execute(
            select(Advisor).where(Advisor.email == request.email)
        )
        advisor = result.scalars().first()
        if not advisor or not verify_password(request.password, advisor.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        
        access_token = create_access_token(subject=advisor.advisor_id, role=advisor.role)
        refresh_token = create_refresh_token(subject=advisor.advisor_id, role=advisor.role)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            role=advisor.role,
            user_id=advisor.advisor_id,
        )

    async def refresh_tokens(self, request: TokenRefreshRequest) -> TokenResponse:
        """Generate new access token from a valid refresh token."""
        try:
            payload = decode_token(request.refresh_token)
            if payload.get("type") != "refresh":
                raise BadRequestError("Invalid token type")
            
            subject = payload.get("sub")
            role = payload.get("role")
            
            # Generate new tokens
            new_access_token = create_access_token(subject=subject, role=role)
            new_refresh_token = create_refresh_token(subject=subject, role=role)
            
            return TokenResponse(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                role=role,
                user_id=subject,
            )
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("Refresh token has expired")
        except jwt.InvalidTokenError:
            raise UnauthorizedError("Invalid refresh token")

    async def register_investor(self, request: SignupRequest) -> dict:
        """Register a new investor, hashing password and setting pending KYC."""
        # Check if phone, email or pan is already registered
        result = await self.db.execute(
            select(Investor).where(
                (Investor.phone == request.phone) | 
                (Investor.email == request.email) | 
                (Investor.pan == request.pan)
            )
        )
        existing = result.scalars().first()
        if existing:
            raise ConflictError("An investor with this phone, email, or PAN is already registered")

        # Generate unique investor ID
        investor_id = f"INV-{random.randint(10000, 99999)}"

        from src.core.security import hash_password
        hashed_pwd = hash_password("123456")

        dob_date = None
        if request.date_of_birth:
            try:
                dob_date = datetime.datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()
            except ValueError:
                raise BadRequestError("Date of birth must be in YYYY-MM-DD format")

        new_investor = Investor(
            investor_id=investor_id,
            full_name=request.full_name,
            email=request.email,
            phone=request.phone,
            pan=request.pan.upper(),
            date_of_birth=dob_date,
            is_active=True,
            hashed_password=hashed_pwd
        )
        self.db.add(new_investor)
        await self.db.flush()

        # Seed initial pending KYC checklist
        new_kyc = KYC(
            investor_id=new_investor.id,
            kyc_status="pending",
            kyc_type="e-KYC",
            pan_verified=False,
            aadhaar_verified=False,
            address_verified=False,
            photo_verified=False,
            remarks="Checklist pending initial Aadhaar/PAN linkages"
        )
        self.db.add(new_kyc)
        await self.db.flush()

        return {
            "success": True,
            "message": "Registration successful! Please login using mock OTP 123456",
            "phone": request.phone
        }
