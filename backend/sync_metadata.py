
import os
import sys
import asyncio
import time
from sqlalchemy import select

# Add project root to python path
sys.path.append(os.getcwd())

from app.database import SessionLocal, create_tables
from app.models.legal_document import LegalDocument
from app.core.vector_store import VectorStore

async def sync_metadata():
    print(f"[{time.strftime('%H:%M:%S')}] Starting metadata sync...")
    
    # Ensure tables exist
    create_tables()
    print(f"[{time.strftime('%H:%M:%S')}] Database tables verified.")
    
    # Initialize VectorStore
    store = VectorStore()
    
    # Get all docs using the optimized method
    print(f"[{time.strftime('%H:%M:%S')}] Fetching indexed documents from ChromaDB...")
    docs_stats = store.get_indexed_documents(force_refresh=True)
    print(f"[{time.strftime('%H:%M:%S')}] Found {len(docs_stats)} documents in ChromaDB.")
    
    db = SessionLocal()
    try:
        total_synced = 0
        total_updated = 0
        
        for doc_stat in docs_stats:
            source_name = doc_stat["source_name"]
            
            # Check if exists
            stmt = select(LegalDocument).where(LegalDocument.source_name == source_name)
            existing_doc = db.execute(stmt).scalar_one_or_none()
            
            if existing_doc:
                # Update chunk count if changed
                if existing_doc.chunk_count != doc_stat["chunk_count"]:
                    existing_doc.chunk_count = doc_stat["chunk_count"]
                    total_updated += 1
            else:
                # Create new
                new_doc = LegalDocument(
                    source_name=source_name,
                    title=source_name.replace(".txt", "").replace("_", " "),
                    doc_type=doc_stat.get("doc_type"),
                    chunk_count=doc_stat["chunk_count"],
                    is_indexed=True
                )
                db.add(new_doc)
                total_synced += 1
        
        db.commit()
        print(f"[{time.strftime('%H:%M:%S')}] Sync complete!")
        print(f"[{time.strftime('%H:%M:%S')}] Added: {total_synced}, Updated: {total_updated}")
        
    except Exception as e:
        print(f"❌ Error syncing: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(sync_metadata())
