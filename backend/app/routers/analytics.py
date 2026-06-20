from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Requirement, Resource, Contract, Match
from app.dependencies import get_current_client, get_current_vendor

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/client/trends")
def get_client_trends(
    period: str = "weekly",  # weekly, monthly, yearly
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Get requirement trends for client dashboard"""
    
    if period == "weekly":
        days = 7
    elif period == "monthly":
        days = 30
    else:
        days = 365
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Get requirements created per day
    requirements_by_date = db.query(
        func.date(Requirement.created_at).label('date'),
        func.count(Requirement.id).label('count')
    ).filter(
        Requirement.client_id == current_user.id,
        Requirement.created_at >= start_date
    ).group_by(func.date(Requirement.created_at)).all()
    
    # Get matches per day
    matches_by_date = db.query(
        func.date(Match.created_at).label('date'),
        func.count(Match.id).label('count')
    ).join(Requirement).filter(
        Requirement.client_id == current_user.id,
        Match.created_at >= start_date
    ).group_by(func.date(Match.created_at)).all()
    
    return {
        "requirements": [{"date": str(r.date), "count": r.count} for r in requirements_by_date],
        "matches": [{"date": str(m.date), "count": m.count} for m in matches_by_date]
    }

@router.get("/vendor/trends")
def get_vendor_trends(
    period: str = "weekly",
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    """Get resource and contract trends for vendor dashboard"""
    
    if period == "weekly":
        days = 7
    elif period == "monthly":
        days = 30
    else:
        days = 365
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Get resources added per day
    resources_by_date = db.query(
        func.date(Resource.created_at).label('date'),
        func.count(Resource.id).label('count')
    ).filter(
        Resource.vendor_id == current_user.id,
        Resource.created_at >= start_date
    ).group_by(func.date(Resource.created_at)).all()
    
    # Get contracts per day
    contracts_by_date = db.query(
        func.date(Contract.created_at).label('date'),
        func.count(Contract.id).label('count')
    ).filter(
        Contract.vendor_id == current_user.id,
        Contract.created_at >= start_date
    ).group_by(func.date(Contract.created_at)).all()
    
    # Get monthly revenue trend
    revenue_by_month = db.query(
        func.strftime('%Y-%m', Contract.created_at).label('month'),
        func.sum(Contract.rate).label('revenue')
    ).filter(
        Contract.vendor_id == current_user.id,
        Contract.status == "Active"
    ).group_by(func.strftime('%Y-%m', Contract.created_at)).all()

    return {
        "resources": [{"date": str(r.date), "count": r.count} for r in resources_by_date],
        "contracts": [{"date": str(c.date), "count": c.count} for c in contracts_by_date],
        "revenue": [{"month": str(m.month), "revenue": float(m.revenue or 0)} for m in revenue_by_month]
    }

@router.get("/vendor/availability-trend")
def get_availability_trend(
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    """Get resource availability trend data for chart"""
    
    # Sample data - in production, this would come from actual tracking
    weekly_data = [
        {"label": "Mon", "value": 85},
        {"label": "Tue", "value": 70},
        {"label": "Wed", "value": 90},
        {"label": "Thu", "value": 75},
        {"label": "Fri", "value": 95},
        {"label": "Sat", "value": 60},
        {"label": "Sun", "value": 50},
    ]
    
    monthly_data = [
        {"label": "Week 1", "value": 75},
        {"label": "Week 2", "value": 82},
        {"label": "Week 3", "value": 88},
        {"label": "Week 4", "value": 78},
    ]
    
    yearly_data = [
        {"label": "Jan", "value": 70},
        {"label": "Feb", "value": 75},
        {"label": "Mar", "value": 80},
        {"label": "Apr", "value": 85},
        {"label": "May", "value": 78},
        {"label": "Jun", "value": 82},
        {"label": "Jul", "value": 88},
        {"label": "Aug", "value": 90},
        {"label": "Sep", "value": 85},
        {"label": "Oct", "value": 87},
        {"label": "Nov", "value": 92},
        {"label": "Dec", "value": 95},
    ]
    
    return {
        "weekly": weekly_data,
        "monthly": monthly_data,
        "yearly": yearly_data
    }