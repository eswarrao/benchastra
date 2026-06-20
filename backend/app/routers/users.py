from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Company
from app.schemas import UserResponse, UserUpdate, CompanyUpdate, CompanyResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

class ProfilePictureUpdate(BaseModel):
    profile_picture: str

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Refresh the user to get latest data
    db.refresh(current_user)
    
    # Explicitly load company data if it exists
    if current_user.company_id:
        company = db.query(Company).filter(Company.id == current_user.company_id).first()
        if company:
            # Set the company relationship so it gets serialized
            current_user.company = company
    
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update user fields
    update_dict = update_data.model_dump(exclude_unset=True, exclude={'company'})
    
    # Handle first_name and last_name
    if 'first_name' in update_dict and 'last_name' in update_dict:
        update_dict['full_name'] = f"{update_dict['first_name']} {update_dict['last_name']}".strip()
    
    # Remove first_name and last_name from update_dict as they're not DB fields
    update_dict.pop('first_name', None)
    update_dict.pop('last_name', None)
    
    # Update user fields (including designation)
    for field, value in update_dict.items():
        if value is not None:
            setattr(current_user, field, value)
    
    # Update company if provided
    if update_data.company:
        company_update = update_data.company.model_dump(exclude_unset=True)
        
        if current_user.company_id:
            # Update existing company
            company = db.query(Company).filter(Company.id == current_user.company_id).first()
            if company:
                for field, value in company_update.items():
                    if value is not None:
                        setattr(company, field, value)
        else:
            # Create new company
            company = Company(
                name=company_update.get('name', ''),
                website=company_update.get('website'),
                industry=company_update.get('industry'),
                description=company_update.get('description'),
                size=company_update.get('size')
            )
            db.add(company)
            db.flush()
            current_user.company_id = company.id
    
    db.commit()
    db.refresh(current_user)
    
    # Load company data for response
    if current_user.company_id:
        company = db.query(Company).filter(Company.id == current_user.company_id).first()
        if company:
            current_user.company = company
    
    return current_user

@router.put("/me/profile-picture")
def update_profile_picture(
    data: ProfilePictureUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate base64 image
    if not data.profile_picture or not data.profile_picture.startswith('data:image/'):
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    # Check file size (approximate - base64 string length)
    if len(data.profile_picture) > 5 * 1024 * 1024:  # ~5MB for base64
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
    
    current_user.profile_picture = data.profile_picture
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile picture updated successfully"}

@router.delete("/me/profile-picture")
def delete_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.profile_picture = None
    db.commit()
    
    return {"message": "Profile picture removed successfully"}

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Load company data
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).first()
        if company:
            user.company = company
    
    return user