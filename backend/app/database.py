"""
Database Configuration
SQLAlchemy engine and session management for FastAPI.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

# Create engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def check_and_migrate_db():
    """Run manual schema migrations for existing tables."""
    from sqlalchemy import text, inspect
    
    try:
        inspector = inspect(engine)
        
        # Check if task_attachments table exists
        if inspector.has_table("task_attachments"):
            columns = [c["name"] for c in inspector.get_columns("task_attachments")]
            if "comment_id" not in columns:
                print("Running migration: Adding comment_id to task_attachments...")
                with engine.connect() as conn:
                    # SQLite syntax vs Postgres syntax might differ slightly, but ADD COLUMN is standard
                    # REFERENCES might need constraint naming in some DBs, but simple REFERENCES usually works
                    conn.execute(text("ALTER TABLE task_attachments ADD COLUMN comment_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE"))
                    conn.commit()
                print("Migration complete.")
    except Exception as e:
        print(f"Migration failed (safe to ignore if running fresh): {e}")
