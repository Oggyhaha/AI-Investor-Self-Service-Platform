from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.auth.schemas import (
    LoginRequest,
    OTPVerifyRequest,
    AdvisorLoginRequest,
    TokenResponse,
    TokenRefreshRequest,
    SignupRequest,
)
from src.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Initiate login by sending a mock OTP code (mock code: 123456)."""
    service = AuthService(db)
    return await service.initiate_otp_login(request)

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify the mock OTP code and receive access and refresh JWT tokens."""
    service = AuthService(db)
    return await service.verify_otp_login(request)

@router.post("/advisor/login", response_model=TokenResponse)
async def advisor_login(request: AdvisorLoginRequest, db: AsyncSession = Depends(get_db)):
    """Log in as an Advisor or Admin using email and password."""
    service = AuthService(db)
    return await service.login_advisor(request)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    """Obtain a new access token using a valid refresh token."""
    service = AuthService(db)
    return await service.refresh_tokens(request)

@router.post("/signup")
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new investor (KYC set to pending, mock OTP: 123456)."""
    service = AuthService(db)
    return await service.register_investor(request)
