"""
FastAPI Application - AI Lawyer Backend
Main application entry point with CORS and router configuration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routers import auth, lawyer, validator, generator, history, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    create_tables()
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
app.include_router(generator.router, prefix="/api/generator", tags=["Contract Generator"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
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
