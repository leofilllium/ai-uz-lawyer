"""
Authentication Router
User registration, login, and profile endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse
)


router = APIRouter()
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """Get current user from JWT token (optional)."""
    if not credentials:
        return None
    
    return AuthService.get_user_from_token(credentials.credentials, db)


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Require valid JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    user = AuthService.get_user_from_token(credentials.credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user


@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    existing = db.query(User).filter(User.email == request.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    # Create user
    user = User(name=request.name, email=request.email.lower())
    user.set_password(request.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    token = AuthService.generate_token(user)
    
    return TokenResponse(
        success=True,
        token=token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    # Find user
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if not user or not user.check_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    # Generate token
    token = AuthService.generate_token(user)
    
    return TokenResponse(
        success=True,
        token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(require_auth)):
    """Get current authenticated user info."""
    return UserResponse.model_validate(current_user)
