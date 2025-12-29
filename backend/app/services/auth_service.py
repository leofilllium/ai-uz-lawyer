"""
Authentication Service
JWT token generation and validation for FastAPI.
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User


settings = get_settings()


class AuthService:
    """Handle JWT token operations."""
    
    @staticmethod
    def generate_token(user: User) -> str:
        """Generate JWT token for user."""
        payload = {
            'user_id': user.id,
            'email': user.email,
            'name': user.name,
            'exp': datetime.utcnow() + timedelta(days=settings.jwt_expiry_days),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
        return token
    
    @staticmethod
    def validate_token(token: str) -> Optional[dict]:
        """Validate JWT token and return payload."""
        try:
            payload = jwt.decode(
                token, 
                settings.secret_key, 
                algorithms=[settings.jwt_algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def get_user_from_token(token: str, db: Session) -> Optional[User]:
        """Get user object from JWT token."""
        payload = AuthService.validate_token(token)
        if not payload:
            return None
        
        user_id = payload.get('user_id')
        if not user_id:
            return None
        
        return db.query(User).filter(User.id == user_id).first()
