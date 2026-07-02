import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import config and database helpers
from src.core.config import get_settings
from src.core.database import init_db, close_db, Base
from src.core.exceptions import register_exception_handlers

# IMPORTANT: Import all SQLAlchemy models here so SQLAlchemy knows about them
# when init_db() calls Base.metadata.create_all()
from src.investors.models import Investor
from src.advisors.models import Advisor
from src.portfolio.models import Fund, PortfolioHolding
from src.sip.models import SIP, Mandate
from src.kyc.models import KYC
from src.nominees.models import Nominee
from src.transactions.models import Transaction
from src.statements.models import Statement
from src.conversations.models import Conversation, ConversationMessage
from src.tickets.models import ServiceRequest, ServiceRequestNote
from src.notifications.models import Notification

# Import routers
from src.auth.router import router as auth_router
from src.investors.router import router as investors_router
from src.portfolio.router import router as portfolio_router
from src.sip.router import router as sip_router
from src.kyc.router import router as kyc_router
from src.nominees.router import router as nominees_router
from src.statements.router import router as statements_router
from src.transactions.router import router as transactions_router
from src.conversations.router import router as conversations_router
from src.tickets.router import router as tickets_router
from src.notifications.router import router as notifications_router
from src.analytics.router import router as analytics_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Context manager handling FastAPI application startup and shutdown routines."""
    # Startup actions
    logger.info("Initializing database and tables...")
    await init_db()
    logger.info("Database initialized successfully.")
    
    yield
    
    # Shutdown actions
    logger.info("Closing database connections...")
    await close_db()
    logger.info("Database connections closed.")

# Create FastAPI app
app = FastAPI(
    title="AURA Platform API",
    description="AI-Powered Investor Self-Service Platform backend",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
register_exception_handlers(app)

# Include API Routers under /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(investors_router, prefix="/api/v1")
app.include_router(portfolio_router, prefix="/api/v1")
app.include_router(sip_router, prefix="/api/v1")
app.include_router(kyc_router, prefix="/api/v1")
app.include_router(nominees_router, prefix="/api/v1")
app.include_router(statements_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")
app.include_router(tickets_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Simple API health check endpoint."""
    return {"status": "healthy", "service": "aura-backend"}
