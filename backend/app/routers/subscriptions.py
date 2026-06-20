from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Subscription
from app.schemas import SubscriptionResponse, SubscriptionUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

# Plan definitions
PLANS = {
    "Free": {"price": 0, "features": ["3 job postings", "Basic candidate search", "Email support", "Standard analytics"]},
    "Basic": {"price": 4999, "features": ["15 job postings", "Advanced candidate filters", "Priority email support", "Advanced analytics", "Team collaboration (5 users)"]},
    "Premium": {"price": 9999, "features": ["Unlimited job postings", "AI-powered matching", "Dedicated account manager", "Custom analytics & reporting", "Unlimited team members", "API access"]}
}

@router.get("/my", response_model=SubscriptionResponse)
def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).first()
    
    if not subscription:
        # Return default free subscription
        return SubscriptionResponse(
            id=0,
            plan="Free",
            amount=0,
            billing_cycle="Monthly",
            start_date=datetime.now(),
            end_date=None,
            is_active=True
        )
    
    return subscription

@router.post("/upgrade")
def upgrade_subscription(
    plan_data: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if plan_data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Deactivate current subscription
    db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).update({"is_active": False})
    
    # Create new subscription
    end_date = datetime.now() + timedelta(days=30)
    subscription = Subscription(
        user_id=current_user.id,
        plan=plan_data.plan,
        amount=PLANS[plan_data.plan]["price"],
        billing_cycle="Monthly",
        end_date=end_date,
        is_active=True
    )
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return {"message": f"Subscription upgraded to {plan_data.plan}"}