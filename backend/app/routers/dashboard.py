from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Requirement, Resource, Contract, Match
from app.schemas import DashboardStats, VendorDashboardStats
from app.dependencies import get_current_client, get_current_vendor, get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/client/stats", response_model=DashboardStats)
def get_client_stats(
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    requirements = db.query(Requirement).filter(Requirement.client_id == current_user.id).all()
    # status is a plain String column, not an Enum — compare directly
    open_requirements = [r for r in requirements if r.status == "Open"]
    closed_requirements = [r for r in requirements if r.status == "Closed"]

    total_matches = 0
    for req in requirements:
        match_count = db.query(Match).filter(Match.requirement_id == req.id).count()
        total_matches += match_count

    return DashboardStats(
        total_requirements=len(requirements),
        open_requirements=len(open_requirements),
        closed_requirements=len(closed_requirements),
        total_matching_profiles=total_matches
    )

@router.get("/vendor/stats", response_model=VendorDashboardStats)
def get_vendor_stats(
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    resources = db.query(Resource).filter(Resource.vendor_id == current_user.id).all()
    active_resources = [r for r in resources if r.status == "Available"]

    contracts = db.query(Contract).filter(Contract.vendor_id == current_user.id).all()
    active_contracts = [c for c in contracts if c.status == "Active"]
    completed_contracts = [c for c in contracts if c.status == "Completed"]

    monthly_revenue = sum(c.rate or 0 for c in active_contracts if c.billing_cycle == "Monthly")

    return VendorDashboardStats(
        active_resources=len(active_resources),
        fulfilled_jobs=len(completed_contracts),
        active_contracts=len(active_contracts),
        monthly_revenue=monthly_revenue
    )