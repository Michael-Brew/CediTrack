from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, AuthenticatedUser
from app.schemas import DashboardSummary, DashboardChartsResponse
from app.services.analytics import get_dashboard_summary, get_dashboard_charts
from app.services.seeder import seed_sample_ghana_data

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def summary_metrics(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    return get_dashboard_summary(db, user.id)

@router.get("/charts", response_model=DashboardChartsResponse)
def chart_metrics(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    return get_dashboard_charts(db, user.id)

@router.post("/seed")
def seed_demo_data(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    result = seed_sample_ghana_data(db, user.id)
    return result
