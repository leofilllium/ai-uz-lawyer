
import sys
import os

# Add project root to python path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.legal_document import LegalDocument

def clear_metadata():
    print("Clearing LegalDocument table...")
    db = SessionLocal()
    try:
        # Delete all records
        num_deleted = db.query(LegalDocument).delete()
        db.commit()
        print(f"✅ Successfully deleted {num_deleted} records from 'legal_documents' table.")
    except Exception as e:
        print(f"❌ Error clearing table: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        clear_metadata()
    else:
        confirm = input("Are you sure you want to delete ALL metadata? (y/n): ")
        if confirm.lower() == 'y':
            clear_metadata()
        else:
            print("Operation cancelled. Pass --force to skip confirmation.")
