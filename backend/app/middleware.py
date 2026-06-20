from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings
from app.database import get_db
from app.models import User
from sqlalchemy.orm import Session
from typing import Optional

security = HTTPBearer()

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """Dependency to get current user from token"""
    
    # Skip for auth endpoints
    if request.url.path.startswith("/auth"):
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        return user
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

async def validate_user_role(request: Request, call_next):
    """Middleware to validate user role - simplified version"""
    
    # Skip validation for auth and public endpoints
    skip_paths = ["/auth", "/docs", "/openapi.json", "/health"]
    if any(request.url.path.startswith(path) for path in skip_paths):
        return await call_next(request)
    
    try:
        # Only validate if Authorization header exists
        auth_header = request.headers.get("Authorization")
        if auth_header:
            # Use dependency injection for the current user
            db = next(get_db())
            try:
                # Extract token
                scheme, token = auth_header.split()
                if scheme.lower() == "bearer":
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                    email = payload.get("sub")
                    token_role = payload.get("role")
                    
                    if email:
                        user = db.query(User).filter(User.email == email).first()
                        if user and token_role and token_role != user.role:
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Role mismatch. You are registered as {user.role}"
                            )
            finally:
                db.close()
                
    except HTTPException:
        raise
    except Exception as e:
        # Don't block requests on validation errors, just log them
        print(f"Role validation error: {e}")
    
    return await call_next(request)