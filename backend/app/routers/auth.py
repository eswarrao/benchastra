from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, OTP
from app.schemas import LoginRequest, Token, UserCreate, UserResponse, OTPRequest, OTPVerifyRequest, PasswordResetRequest
from app.auth import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.utils.email_service import generate_otp, send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# STATIC OTP FOR TESTING - Use "123456" for all OTP verifications
STATIC_OTP = "123456"

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
        )
    
    # ALWAYS use the role from the database, not from the request
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "role": user.role  # Include role in response
    }

@router.post("/signup", response_model=UserResponse)
def signup(request: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Hash password with error handling
    try:
        hashed_password = get_password_hash(request.password)
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing password",
        )
    
    # Create user
    user = User(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name,
        phone=request.phone,
        role=request.role.value if hasattr(request.role, 'value') else request.role,
        company_id=None,
        is_active=True,
        is_verified=False,
        vendor_name=request.vendor_name
    )
    
    # Create company if provided
    if request.company_name:
        from app.models import Company
        company = Company(
            name=request.company_name,
            website=request.website,
            industry=request.industry,
            size=request.company_size
        )
        db.add(company)
        db.flush()
        user.company_id = company.id
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Use STATIC OTP for testing instead of generating random one
    otp_code = STATIC_OTP
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(
        email=user.email, 
        otp=otp_code, 
        purpose="verification", 
        expires_at=expires_at
    )
    db.add(otp)
    db.commit()
    
    # Print to console for visibility (helpful for debugging)
    print(f"\n{'='*50}")
    print(f"  SIGNUP SUCCESSFUL")
    print(f"  Email: {user.email}")
    print(f"  STATIC OTP: {otp_code}")
    print(f"  (valid for 10 minutes)")
    print(f"{'='*50}\n")
    
    # Try to send email but don't fail if it doesn't work
    try:
        send_otp_email(user.email, otp_code, "verification")
    except Exception as e:
        print(f"Email sending failed (using static OTP): {e}")
    
    return user

@router.post("/send-otp")
def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    print(f"=== SEND OTP ENDPOINT HIT ===")
    print(f"Request email: {request.email}")
    
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        print(f"User not found: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    print(f"User found: {user.email}")
    
    # Use STATIC OTP for testing
    otp_code = STATIC_OTP
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Invalidate old OTPs
    db.query(OTP).filter(
        OTP.email == request.email, 
        OTP.is_used == False
    ).update({"is_used": True})
    
    # Create new OTP
    otp = OTP(
        email=request.email, 
        otp=otp_code, 
        purpose="password_reset", 
        expires_at=expires_at
    )
    db.add(otp)
    db.commit()
    
    print(f"\n{'='*50}")
    print(f"  PASSWORD RESET OTP")
    print(f"  Email: {user.email}")
    print(f"  STATIC OTP: {otp_code}")
    print(f"{'='*50}\n")
    
    # Try to send email but don't fail if it doesn't work
    try:
        send_otp_email(request.email, otp_code, "password_reset")
        print(f"Email sent to {request.email}")
    except Exception as e:
        print(f"Email sending failed (using static OTP): {e}")
    
    return {"message": "OTP sent successfully", "otp": otp_code}  # Return OTP for testing

@router.post("/verify-otp")
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    # First check if it's the static test OTP
    if request.otp == STATIC_OTP:
        # Find any pending OTP for this email
        otp_record = db.query(OTP).filter(
            OTP.email == request.email,
            OTP.is_used == False
        ).first()
        
        if otp_record:
            otp_record.is_used = True
            db.commit()
        
        # Verify the user if this is a verification OTP
        if otp_record and otp_record.purpose == "verification":
            user = db.query(User).filter(User.email == request.email).first()
            if user:
                user.is_verified = True
                db.commit()
        
        return {"message": "OTP verified successfully"}
    
    # Regular OTP verification flow (for non-static OTPs)
    otp_record = db.query(OTP).filter(
        OTP.email == request.email,
        OTP.otp == request.otp,
        OTP.is_used == False,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    
    otp_record.is_used = True
    db.commit()
    
    # If verification OTP, verify user
    if otp_record.purpose == "verification":
        user = db.query(User).filter(User.email == request.email).first()
        if user:
            user.is_verified = True
            db.commit()
    
    return {"message": "OTP verified successfully"}

@router.post("/resend-otp")
def resend_otp(request: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Use STATIC OTP for testing
    otp_code = STATIC_OTP
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Invalidate old OTPs
    db.query(OTP).filter(
        OTP.email == request.email, 
        OTP.is_used == False,
        OTP.purpose == "verification"
    ).update({"is_used": True})
    
    # Create new OTP
    otp = OTP(
        email=request.email, 
        otp=otp_code, 
        purpose="verification", 
        expires_at=expires_at
    )
    db.add(otp)
    db.commit()
    
    print(f"\n{'='*50}")
    print(f"  RESEND OTP")
    print(f"  Email: {user.email}")
    print(f"  STATIC OTP: {otp_code}")
    print(f"{'='*50}\n")
    
    try:
        send_otp_email(request.email, otp_code, "verification")
    except Exception as e:
        print(f"Email sending failed (using static OTP): {e}")
    
    return {"message": "OTP resent successfully"}

@router.post("/reset-password")
def reset_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    # First check if it's the static test OTP
    if request.otp == STATIC_OTP:
        # Find any pending password reset OTP for this email
        otp_record = db.query(OTP).filter(
            OTP.email == request.email,
            OTP.is_used == False,
            OTP.purpose == "password_reset"
        ).first()
        
        if otp_record:
            otp_record.is_used = True
            db.commit()
        else:
            # Create a dummy record to mark as used for static OTP
            # This allows static OTP to work even without a database record
            pass
        
        # Update password
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        user.hashed_password = get_password_hash(request.new_password)
        db.commit()
        
        return {"message": "Password reset successfully"}
    
    # Regular OTP verification flow
    otp_record = db.query(OTP).filter(
        OTP.email == request.email,
        OTP.otp == request.otp,
        OTP.is_used == False,
        OTP.expires_at > datetime.utcnow(),
        OTP.purpose == "password_reset"
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    
    otp_record.is_used = True
    db.commit()
    
    # Update password
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password reset successfully"}

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    token = request.refresh_token
    try:
        payload = verify_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        new_access_token = create_access_token(data={"sub": user.email, "role": user.role})
        new_refresh_token = create_refresh_token(data={"sub": user.email})
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )