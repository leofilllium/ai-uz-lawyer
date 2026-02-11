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
from app.routers import auth, lawyer, validator, generator, history, admin, doc_validator


# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    logger.info("Implementation plan applied: Initializing database tables...")
    create_tables()
    
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
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(lawyer.router, prefix="/api/lawyer", tags=["Lawyer Chat"])
app.include_router(validator.router, prefix="/api/validator", tags=["Contract Validator"])
app.include_router(doc_validator.router, prefix="/api/document-validator", tags=["Document Validator"])
app.include_router(generator.router, prefix="/api/generator", tags=["Contract Generator"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
from app.routers import contact
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])


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
