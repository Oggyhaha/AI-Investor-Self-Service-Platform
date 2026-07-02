from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import get_db
from src.core.security import decode_token
from src.investors.models import Investor
from src.advisors.models import Advisor

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user_payload(token: str = Depends(reusable_oauth2)) -> dict:
    """FastAPI dependency to extract and validate the JWT token payload.

    Args:
        token: Bearer token from request.

    Returns:
        The validated token payload dictionary.
    """
    try:
        payload = decode_token(token)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_investor(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> Investor:
    """Dependency that returns the currently authenticated investor.

    Ensures the user role in JWT is 'investor' and user exists in database.
    """
    if payload.get("role") != "investor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investor access required",
        )
    
    investor_id = payload.get("sub")
    result = await db.execute(
        select(Investor).where(Investor.investor_id == investor_id)
    )
    investor = result.scalars().first()
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Investor not found",
        )
    if not investor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive investor account",
        )
    return investor

async def get_current_advisor(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> Advisor:
    """Dependency that returns the currently authenticated advisor.

    Ensures the user role is 'advisor' or 'admin'.
    """
    role = payload.get("role")
    if role not in ["advisor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Advisor access required",
        )
    
    advisor_id = payload.get("sub")
    result = await db.execute(
        select(Advisor).where(Advisor.advisor_id == advisor_id)
    )
    advisor = result.scalars().first()
    if not advisor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Advisor not found",
        )
    return advisor

async def get_current_admin(
    current_advisor: Advisor = Depends(get_current_advisor),
) -> Advisor:
    """Dependency that ensures the authenticated advisor has an 'admin' role."""
    if current_advisor.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required",
        )
    return current_advisor
