from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, Contract, Invoice
from app.schemas import InvoiceResponse, SubscriptionPlan
from app.dependencies import get_current_user

router = APIRouter(prefix="/billing", tags=["Billing"])

SUBSCRIPTION_PLANS = [
    {
        "name": "Free",
        "price": 0,
        "period": "/month",
        "features": ["3 job postings", "Basic candidate search", "Email support", "Standard analytics"]
    },
    {
        "name": "Basic",
        "price": 4999,
        "period": "/month",
        "features": ["15 job postings", "Advanced candidate filters", "Priority email support", "Advanced analytics", "Team collaboration (5 users)"]
    },
    {
        "name": "Premium",
        "price": 9999,
        "period": "/month",
        "features": ["Unlimited job postings", "AI-powered matching", "Dedicated account manager", "Custom analytics & reporting", "Unlimited team members", "API access"]
    }
]

@router.get("/plans", response_model=List[SubscriptionPlan])
def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoices = db.query(Invoice).filter(Invoice.user_id == current_user.id).order_by(Invoice.created_at.desc()).all()
    return invoices

@router.post("/create-order")
def create_order(
    plan_name: str,
    current_user: User = Depends(get_current_user)
):
    # This would integrate with a payment gateway like Razorpay
    # For now, return a mock order
    plan = next((p for p in SUBSCRIPTION_PLANS if p["name"] == plan_name), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    return {
        "order_id": f"order_{int(datetime.now().timestamp())}",
        "amount": plan["price"],
        "currency": "INR",
        "plan": plan_name
    }