from sqlalchemy.orm import Session
from app.models import Notification

def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "system", related_id: int = None):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_id=related_id
    )
    db.add(notification)
    db.commit()
    return notification

def create_match_notification(db: Session, requirement_id: int, resource_id: int, match_score: int):
    """Create notifications for both client and vendor when a match is found"""
    from app.models import Requirement, Resource
    
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    
    if requirement:
        # Notify client
        create_notification(
            db=db,
            user_id=requirement.client_id,
            title="New Match Found",
            message=f"A new resource with {match_score}% match has been found for your requirement: {requirement.role}",
            type="match",
            related_id=requirement_id
        )
    
    if resource:
        # Notify vendor
        create_notification(
            db=db,
            user_id=resource.vendor_id,
            title="New Match Found",
            message=f"Your resource {resource.name} has been matched with a new requirement",
            type="match",
            related_id=resource_id
        )