"""
FastAPI Application - AI Lawyer Backend
Main application entry point with CORS and router configuration.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
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
    contact
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    logger.info("Creating database tables...")
    create_tables()
    yield
    # Shutdown (if needed)

app = FastAPI(
    title="AI Lawyer API",
    description="Backend API for AI Lawyer Uzbekistan",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://lawyerai.uz",
    "https://www.lawyerai.uz",
    "*"  # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "docs": "/docs",
        "health": "/health"
    }
