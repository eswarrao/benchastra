from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, JSON, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    CLIENT = "client"
    VENDOR = "vendor"

class RequirementStatus(str, enum.Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class ResourceStatus(str, enum.Enum):
    AVAILABLE = "Available"
    BUSY = "Busy"
    ON_LEAVE = "On Leave"

class ContractStatus(str, enum.Enum):
    ACTIVE = "Active"
    PENDING = "Pending"
    COMPLETED = "Completed"

class BillingCycle(str, enum.Enum):
    MONTHLY = "Monthly"
    QUARTERLY = "Quarterly"
    YEARLY = "Yearly"

# Many-to-many relationship for resource_skills
resource_skills = Table(
    'resource_skills',
    Base.metadata,
    Column('resource_id', Integer, ForeignKey('resources.id')),
    Column('skill', String(100)),
    extend_existing=True
)

class OTP(Base):
    __tablename__ = "otps"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp = Column(String(6), nullable=False)
    purpose = Column(String(50), default="verification")
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_used = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Company(Base):
    __tablename__ = "companies"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    website = Column(String(255))
    industry = Column(String(100))
    size = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20))
    role = Column(String(50), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    vendor_name = Column(String(255))
    profile_picture = Column(Text, nullable=True)
    designation = Column(String(255), nullable=True)  # ADD THIS LINE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    company = relationship("Company", back_populates="users")
    requirements = relationship("Requirement", back_populates="client")
    resources = relationship("Resource", back_populates="vendor")
    contracts_as_client = relationship("Contract", foreign_keys="Contract.client_id", back_populates="client")
    contracts_as_vendor = relationship("Contract", foreign_keys="Contract.vendor_id", back_populates="vendor")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    notifications = relationship("Notification", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    invoices = relationship("Invoice", back_populates="user")

class Requirement(Base):
    __tablename__ = "requirements"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(String(50), unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(255), nullable=False)
    experience_min = Column(Integer)
    experience_max = Column(Integer)
    positions = Column(Integer, default=1)
    skills = Column(JSON, default=[])
    must_have_skills = Column(JSON, default=[])
    good_to_have_skills = Column(JSON, default=[])
    budget_min = Column(Float)
    budget_max = Column(Float)
    duration = Column(String(50), default="6 Months")
    work_mode = Column(String(50), default="Remote")
    start_date = Column(String(50), default="Immediate")
    custom_start_date = Column(DateTime)
    location = Column(String(255))
    description = Column(Text)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    client = relationship("User", back_populates="requirements")
    matches = relationship("Match", back_populates="requirement")
    contract = relationship("Contract", back_populates="requirement", uselist=False)

class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(50), unique=True, index=True, nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    skill_domain = Column(String(255))
    experience = Column(String(50))
    experience_years = Column(Integer)
    availability = Column(String(50))
    availability_days = Column(Integer)
    base_rate = Column(Float)
    location = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    summary = Column(Text)
    resume_url = Column(String(500))
    skills = Column(JSON, default=[])
    status = Column(String(50), default="Available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    vendor = relationship("User", back_populates="resources")
    matches = relationship("Match", back_populates="resource")
    contract = relationship("Contract", back_populates="resource", uselist=False)

class Match(Base):
    __tablename__ = "matches"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    match_score = Column(Integer, default=0)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    requirement = relationship("Requirement", back_populates="matches")
    resource = relationship("Resource", back_populates="matches")

class Contract(Base):
    __tablename__ = "contracts"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(String(50), unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("requirements.id"))
    resource_id = Column(Integer, ForeignKey("resources.id"))
    rate = Column(Float)
    billing_cycle = Column(String(50), default="Monthly")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    description = Column(Text)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    client = relationship("User", foreign_keys=[client_id], back_populates="contracts_as_client")
    vendor = relationship("User", foreign_keys=[vendor_id], back_populates="contracts_as_vendor")
    requirement = relationship("Requirement", back_populates="contract")
    resource = relationship("Resource", back_populates="contract")
    invoices = relationship("Invoice", back_populates="contract")

class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="Pending")
    due_date = Column(DateTime)
    paid_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="invoices")
    contract = relationship("Contract", back_populates="invoices")

class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system")
    related_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="notifications")

class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan = Column(String(50), default="Free")
    amount = Column(Float, default=0)
    billing_cycle = Column(String(50), default="Monthly")
    start_date = Column(DateTime, server_default=func.now())
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="subscription")