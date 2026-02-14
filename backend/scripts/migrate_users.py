
import os
import sys
from sqlalchemy import create_engine, text
from app.config import get_settings

def migrate_users_table():
    """Add missing columns to users table if they don't exist."""
    print("Starting user table migration...")
    
    settings = get_settings()
    # Use the database URL from settings
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # Check if columns exist
        print("Checking for missing columns...")
        
        # Add role column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'EMPLOYEE'"))
            print("Verified/Added 'role' column.")
        except Exception as e:
            print(f"Error adding 'role': {e}")

        # Add is_approved column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE"))
            print("Verified/Added 'is_approved' column.")
        except Exception as e:
            print(f"Error adding 'is_approved': {e}")
            
        # Add organization_id column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)"))
            print("Verified/Added 'organization_id' column.")
        except Exception as e:
            print(f"Error adding 'organization_id': {e}")
            
        conn.commit()
    
    print("Migration complete.")

if __name__ == "__main__":
    # Ensure app directory is in python path
    sys.path.append(os.getcwd())
    migrate_users_table()
