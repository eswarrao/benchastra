from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import Contract, User, Resource, Match, Requirement
from app.schemas import ResourceCreate, ResourceUpdate, ResourceResponse
from app.dependencies import get_current_user, get_current_vendor
from app.utils.helpers import generate_resource_id

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Both clients and vendors can view resources"""
    query = db.query(Resource)
    
    # If vendor, only show their own resources
    # If client, show all available resources
    if current_user.role == "vendor":
        query = query.filter(Resource.vendor_id == current_user.id)
    # Clients can see all resources - no filter needed
    
    if status:
        query = query.filter(Resource.status == status)
    
    if search:
        query = query.filter(
            (Resource.name.ilike(f"%{search}%")) |
            (Resource.skill_domain.ilike(f"%{search}%")) |
            (Resource.location.ilike(f"%{search}%"))
        )
    
    resources = query.order_by(Resource.created_at.desc()).offset(skip).limit(limit).all()
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Both clients and vendors can view a specific resource"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Vendors can only see their own resources
    # Clients can see any resource
    if current_user.role == "vendor" and resource.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this resource")
    
    return resource

@router.post("/", response_model=ResourceResponse)
def create_resource(
    resource: ResourceCreate,
    current_user: User = Depends(get_current_vendor),  # Only vendors can create
    db: Session = Depends(get_db)
):
    resource_id = generate_resource_id()
    
    skills_json = resource.skills if resource.skills else []
    
    db_resource = Resource(
        resource_id=resource_id,
        vendor_id=current_user.id,
        name=resource.name,
        skill_domain=resource.skill_domain,
        experience=resource.experience,
        experience_years=resource.experience_years,
        availability=resource.availability,
        availability_days=resource.availability_days,
        base_rate=resource.base_rate,
        location=resource.location,
        email=resource.email,
        phone=resource.phone,
        summary=resource.summary,
        resume_url=resource.resume_url,
        skills=skills_json,
        status="Available"
    )
    
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    
    match_with_requirements(db_resource, db)
    
    return db_resource

@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    resource: ResourceUpdate,
    current_user: User = Depends(get_current_vendor),  # Only vendors can update
    db: Session = Depends(get_db)
):
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if db_resource.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this resource")
    
    update_data = resource.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_resource, field, value)
    
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    try:
        # First find the resource
        db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not db_resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Check ownership
        if db_resource.vendor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this resource")
        
        # Delete related matches first (foreign key constraint)
        db.query(Match).filter(Match.resource_id == resource_id).delete()
        
        # Delete any contracts associated with this resource
        db.query(Contract).filter(Contract.resource_id == resource_id).delete()
        
        # Delete the resource
        db.delete(db_resource)
        db.commit()
        
        return {"message": "Resource deleted successfully", "success": True}
    except Exception as e:
        db.rollback()
        print(f"Error deleting resource: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting resource: {str(e)}")
    
def match_with_requirements(resource: Resource, db: Session):
    from app.routers.requirements import calculate_match_score
    
    requirements = db.query(Requirement).filter(Requirement.status == "Open").all()
    
    for req in requirements:
        score = calculate_match_score(req, resource)
        if score >= 70:
            existing_match = db.query(Match).filter(
                Match.requirement_id == req.id,
                Match.resource_id == resource.id
            ).first()
            
            if not existing_match:
                match = Match(
                    requirement_id=req.id,
                    resource_id=resource.id,
                    match_score=score
                )
                db.add(match)
    
    db.commit()