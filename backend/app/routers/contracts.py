from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Contract, Requirement, Resource
from app.schemas import ContractCreate, ContractResponse, ContractStatus
from app.dependencies import get_current_user
from app.utils.helpers import generate_contract_id

router = APIRouter(prefix="/contracts", tags=["Contracts"])

# Add this schema for contract update
class ContractUpdate(BaseModel):
    status: Optional[ContractStatus] = None
    rate: Optional[float] = None
    billing_cycle: Optional[str] = None
    description: Optional[str] = None

@router.get("/", response_model=List[ContractResponse])
def get_contracts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Contract)
    
    if current_user.role == "client":
        query = query.filter(Contract.client_id == current_user.id)
    elif current_user.role == "vendor":
        query = query.filter(Contract.vendor_id == current_user.id)
    
    if status:
        query = query.filter(Contract.status == status)
    
    contracts = query.order_by(Contract.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add names to response
    result = []
    for contract in contracts:
        client = db.query(User).filter(User.id == contract.client_id).first()
        vendor = db.query(User).filter(User.id == contract.vendor_id).first()
        requirement = db.query(Requirement).filter(Requirement.id == contract.requirement_id).first()
        resource = db.query(Resource).filter(Resource.id == contract.resource_id).first()
        
        result.append(ContractResponse(
            id=contract.id,
            contract_id=contract.contract_id,
            client_id=contract.client_id,
            vendor_id=contract.vendor_id,
            requirement_id=contract.requirement_id,
            resource_id=contract.resource_id,
            rate=contract.rate,
            billing_cycle=contract.billing_cycle,
            start_date=contract.start_date,
            end_date=contract.end_date,
            description=contract.description,
            status=contract.status,
            created_at=contract.created_at,
            client_name=(client.full_name or client.email) if client else None,
            vendor_name=(vendor.vendor_name or vendor.full_name or vendor.email) if vendor else None,
            requirement_role=requirement.role if requirement else None,
            resource_name=resource.name if resource else None
        ))
    
    return result

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check authorization
    if contract.client_id != current_user.id and contract.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this contract")
    
    client = db.query(User).filter(User.id == contract.client_id).first()
    vendor = db.query(User).filter(User.id == contract.vendor_id).first()
    requirement = db.query(Requirement).filter(Requirement.id == contract.requirement_id).first()
    resource = db.query(Resource).filter(Resource.id == contract.resource_id).first()
    
    return ContractResponse(
        id=contract.id,
        contract_id=contract.contract_id,
        client_id=contract.client_id,
        vendor_id=contract.vendor_id,
        requirement_id=contract.requirement_id,
        resource_id=contract.resource_id,
        rate=contract.rate,
        billing_cycle=contract.billing_cycle,
        start_date=contract.start_date,
        end_date=contract.end_date,
        description=contract.description,
        status=contract.status,
        created_at=contract.created_at,
        client_name=(client.full_name or client.email) if client else None,
        vendor_name=(vendor.vendor_name or vendor.full_name or vendor.email) if vendor else None,
        requirement_role=requirement.role if requirement else None,
        resource_name=resource.name if resource else None
    )

@router.post("/", response_model=ContractResponse)
def create_contract(
    contract: ContractCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract_id = generate_contract_id()
    
    # Get requirement to get client info
    requirement = db.query(Requirement).filter(Requirement.id == contract.requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    client_id = requirement.client_id
    
    # Get resource to get vendor info
    resource = db.query(Resource).filter(Resource.id == contract.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    vendor_id = resource.vendor_id
    
    # Check if current user is authorized
    if current_user.role == "client" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized to create contract for this requirement")
    if current_user.role == "vendor" and current_user.id != vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized to create contract for this resource")
    
    db_contract = Contract(
        contract_id=contract_id,
        client_id=client_id,
        vendor_id=vendor_id,
        requirement_id=contract.requirement_id,
        resource_id=contract.resource_id,
        rate=contract.rate,
        billing_cycle=contract.billing_cycle,
        start_date=contract.start_date,
        end_date=contract.end_date,
        description=contract.description,
        status="Pending"
    )
    
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    
    # Update resource status to Busy
    resource.status = "Busy"
    db.commit()
    
    return ContractResponse(
        id=db_contract.id,
        contract_id=db_contract.contract_id,
        client_id=db_contract.client_id,
        vendor_id=db_contract.vendor_id,
        requirement_id=db_contract.requirement_id,
        resource_id=db_contract.resource_id,
        rate=db_contract.rate,
        billing_cycle=db_contract.billing_cycle,
        start_date=db_contract.start_date,
        end_date=db_contract.end_date,
        description=db_contract.description,
        status=db_contract.status,
        created_at=db_contract.created_at,
        client_name=(requirement.client.full_name or requirement.client.email) if requirement.client else None,
        vendor_name=(resource.vendor.vendor_name or resource.vendor.full_name or resource.vendor.email) if resource.vendor else None,
        requirement_role=requirement.role,
        resource_name=resource.name
    )

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    contract_update: ContractUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check authorization
    if contract.client_id != current_user.id and contract.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this contract")
    
    # Update fields
    update_data = contract_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    
    # Get related data for response
    client = db.query(User).filter(User.id == contract.client_id).first()
    vendor = db.query(User).filter(User.id == contract.vendor_id).first()
    requirement = db.query(Requirement).filter(Requirement.id == contract.requirement_id).first()
    resource = db.query(Resource).filter(Resource.id == contract.resource_id).first()
    
    return ContractResponse(
        id=contract.id,
        contract_id=contract.contract_id,
        client_id=contract.client_id,
        vendor_id=contract.vendor_id,
        requirement_id=contract.requirement_id,
        resource_id=contract.resource_id,
        rate=contract.rate,
        billing_cycle=contract.billing_cycle,
        start_date=contract.start_date,
        end_date=contract.end_date,
        description=contract.description,
        status=contract.status,
        created_at=contract.created_at,
        client_name=(client.full_name or client.email) if client else None,
        vendor_name=(vendor.vendor_name or vendor.full_name or vendor.email) if vendor else None,
        requirement_role=requirement.role if requirement else None,
        resource_name=resource.name if resource else None
    )

@router.put("/{contract_id}/status")
def update_contract_status(
    contract_id: int,
    status: ContractStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only client or vendor can update status
    if contract.client_id != current_user.id and contract.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    contract.status = status
    db.commit()
    
    return {"message": f"Contract status updated to {status.value}"}

@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.client_id != current_user.id and contract.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this contract")
    
    db.delete(contract)
    db.commit()
    
    return {"message": "Contract deleted successfully"}