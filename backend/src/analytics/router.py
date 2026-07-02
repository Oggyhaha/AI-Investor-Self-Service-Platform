from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.auth.dependencies import get_current_admin
from src.advisors.models import Advisor
from src.analytics.schemas import DashboardMetrics
from src.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardMetrics)
async def get_analytics_dashboard(
    current_admin: Advisor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full platform statistics, including AI usage, user volumes, and support tickets status (admin only)."""
    service = AnalyticsService(db)
    return await service.get_dashboard_metrics()
