from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Message
from app.schemas import MessageCreate, MessageResponse
from app.dependencies import get_current_user
from app.utils.notifications import create_notification

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.get("/", response_model=List[MessageResponse])
def get_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    with_user: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Both clients and vendors can view their own messages"""
    query = db.query(Message).filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    )
    
    if with_user:
        query = query.filter(
            (Message.sender_id == with_user) | (Message.receiver_id == with_user)
        )
    
    messages = query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            message=msg.message,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=(sender.full_name or sender.email) if sender else "Unknown"
        ))
    
    return result

@router.post("/", response_model=MessageResponse)
def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Both clients and vendors can send messages"""
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        requirement_id=message_data.requirement_id,
        resource_id=message_data.resource_id,
        message=message_data.message
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    create_notification(
        db=db,
        user_id=receiver.id,
        title="New Message",
        message=f"You have a new message from {current_user.full_name or current_user.email}",
        type="system"
    )
    
    return db_message

@router.put("/{message_id}/read")
def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message.is_read = True
    db.commit()
    
    return {"message": "Message marked as read"}

@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}