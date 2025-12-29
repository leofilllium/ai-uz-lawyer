"""
API Routers
All FastAPI routers for the application.
"""

from app.routers import auth, lawyer, validator, generator, history

__all__ = ['auth', 'lawyer', 'validator', 'generator', 'history']
