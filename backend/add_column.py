
import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SQLALCHEMY_DATABASE_URL

def add_column():
    print(f"Connecting to database: {SQLALCHEMY_DATABASE_URL}")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print("Attempting to add 'analysis_results' column to 'generated_contracts' table...")
            # Check if column exists first to avoid error
            check_sql = text("SELECT column_name FROM information_schema.columns WHERE table_name='generated_contracts' AND column_name='analysis_results'")
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print("Column 'analysis_results' already exists.")
            else:
                # Add the column
                alter_sql = text("ALTER TABLE generated_contracts ADD COLUMN analysis_results JSON DEFAULT '{}'")
                conn.execute(alter_sql)
                conn.commit()
                print("Successfully added 'analysis_results' column.")
                
        except Exception as e:
            print(f"Error adding column: {e}")
            # Try rollback if needed (though DDL is often auto-committed or not transaction-safe in some DBs, consistent with SQLAlchemy usage here)
            # conn.rollback() 

if __name__ == "__main__":
    add_column()
