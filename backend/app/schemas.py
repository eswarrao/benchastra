from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    VENDOR = "vendor"

class RequirementStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class ResourceStatus(str, Enum):
    AVAILABLE = "Available"
    BUSY = "Busy"
    ON_LEAVE = "On Leave"

class ContractStatus(str, Enum):
    ACTIVE = "Active"
    PENDING = "Pending"
    COMPLETED = "Completed"

class NotificationType(str, Enum):
    REQUIREMENT = "requirement"
    MATCH = "match"
    CONTRACT = "contract"
    SYSTEM = "system"

# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole

class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    vendor_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    company_id: Optional[int] = None
    is_active: bool
    is_verified: bool
    vendor_name: Optional[str] = None
    profile_picture: Optional[str] = None
    designation: Optional[str] = None
    company: Optional[CompanyResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    vendor_name: Optional[str] = None
    profile_picture: Optional[str] = None
    designation: Optional[str] = None
    company: Optional[CompanyUpdate] = None

# Requirement Schemas
class RequirementBase(BaseModel):
    role: str
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    positions: int = 1
    skills: List[str] = []
    must_have_skills: List[str] = []
    good_to_have_skills: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    duration: str = "6 Months"
    work_mode: str = "Remote"
    start_date: str = "Immediate"
    custom_start_date: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None

class RequirementCreate(RequirementBase):
    pass

class RequirementUpdate(RequirementBase):
    status: Optional[RequirementStatus] = None

class RequirementResponse(RequirementBase):
    id: int
    requirement_id: str
    client_id: int
    status: RequirementStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    matches_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

# Resource Schemas
class ResourceBase(BaseModel):
    name: str
    skill_domain: Optional[str] = None
    experience: Optional[str] = None
    experience_years: Optional[int] = None
    availability: Optional[str] = None
    availability_days: Optional[int] = None
    base_rate: Optional[float] = None
    location: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    resume_url: Optional[str] = None
    skills: List[str] = []

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(ResourceBase):
    status: Optional[ResourceStatus] = None

class ResourceResponse(ResourceBase):
    id: int
    resource_id: str
    vendor_id: int
    status: ResourceStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Match Schemas
class MatchResponse(BaseModel):
    id: int
    requirement_id: str
    resource_id: str
    match_score: int
    status: str
    resource_name: str
    resource_skills: List[str]
    resource_experience: str
    resource_availability: str
    resource_rate: float
    requirement_role: Optional[str] = None
    
    class Config:
        from_attributes = True

class MatchUpdate(BaseModel):
    status: str

# Contract Schemas
class ContractBase(BaseModel):
    rate: float
    billing_cycle: str
    start_date: datetime
    end_date: datetime
    description: Optional[str] = None

class ContractCreate(ContractBase):
    requirement_id: int
    resource_id: int

class ContractResponse(ContractBase):
    id: int
    contract_id: str
    client_id: int
    vendor_id: int
    requirement_id: Optional[int] = None
    resource_id: Optional[int] = None
    status: ContractStatus
    created_at: datetime
    client_name: Optional[str] = None
    vendor_name: Optional[str] = None
    requirement_role: Optional[str] = None
    resource_name: Optional[str] = None

class ContractUpdate(BaseModel):
    status: Optional[ContractStatus] = None
    rate: Optional[float] = None
    billing_cycle: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceResponse(BaseModel):
    id: int
    invoice_id: str
    user_id: int
    contract_id: int
    amount: float
    status: str
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Message Schemas
class MessageCreate(BaseModel):
    receiver_id: int
    requirement_id: Optional[int] = None
    resource_id: Optional[int] = None
    message: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    related_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_requirements: int
    open_requirements: int
    closed_requirements: int
    total_matching_profiles: int
    recent_requirements: List[RequirementResponse] = []
    recent_activity: List[dict] = []

class VendorDashboardStats(BaseModel):
    active_resources: int
    fulfilled_jobs: int
    active_contracts: int
    monthly_revenue: float
    recent_resources: List[ResourceResponse] = []
    recent_contracts: List[ContractResponse] = []

# Billing Schemas
class SubscriptionPlan(BaseModel):
    name: str
    price: float
    period: str
    features: List[str]

class SubscriptionResponse(BaseModel):
    id: int
    plan: str
    amount: float
    billing_cycle: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class SubscriptionUpdate(BaseModel):
    plan: str

# Analytics Schemas
class TrendDataPoint(BaseModel):
    label: str
    value: int

class TrendResponse(BaseModel):
    weekly: List[TrendDataPoint]
    monthly: List[TrendDataPoint]
    yearly: List[TrendDataPoint]

class ClientTrendsResponse(BaseModel):
    requirements: List[dict]
    matches: List[dict]

class VendorTrendsResponse(BaseModel):
    resources: List[dict]
    contracts: List[dict]
    revenue: List[dict]