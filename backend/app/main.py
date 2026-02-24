"""
FastAPI Application - AI Lawyer Backend
Main application entry point with CORS, security middleware, and router configuration.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.core.security import limiter, SecurityHeadersMiddleware
from app.database import create_tables, check_and_migrate_db
from app.routers import (
    auth, 
    lawyer, 
    validator, 
    generator, 
    history, 
    admin, 
    doc_validator, 
    organization, 
    tasks,
    contact,
    contact,
    calendar,
    stats
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    logger.info("Implementation plan applied: Initializing database tables...")
    create_tables()
    check_and_migrate_db()
    
    # Initialize singleton VectorStore (heaviest part)
    logger.info("Initializing VectorStore (loading index)... This may take a while for large datasets.")
    try:
        from app.core.vector_store import get_vector_store
        # This triggers the singleton initialization
        get_vector_store()
        logger.info("VectorStore initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize VectorStore: {e}")
        
    yield
    # Shutdown (cleanup if needed)

settings = get_settings()

app = FastAPI(
    title="AI Lawyer API",
    description="Backend API for AI-powered legal assistant with RAG",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# ---------------------------------------------------------------------------
# Security: Rate Limiter
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# Security: Headers Middleware
# ---------------------------------------------------------------------------
app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------------------------
# Security: Trusted Hosts
# ---------------------------------------------------------------------------
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "lawyerai.uz",
            "api.lawyerai.uz",
            "*.lawyerai.uz",
            "localhost",
        ],
    )

# ---------------------------------------------------------------------------
# CORS Configuration (tightened)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(organization.router, prefix="/api/organization", tags=["Organization"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(lawyer.router, prefix="/api/lawyer", tags=["Lawyer Chat"])
app.include_router(validator.router, prefix="/api/validator", tags=["Contract Validator"])
app.include_router(doc_validator.router, prefix="/api/document-validator", tags=["Document Validator"])
app.include_router(generator.router, prefix="/api/generator", tags=["Contract Generator"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(stats.router, prefix="/api/stats", tags=["Usage Stats"])

# Static files for uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "AI Lawyer API",
        "version": "2.0.0",
    }
