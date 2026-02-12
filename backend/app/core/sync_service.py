"""
Sync Service
Synchronizes the SQL database (LegalDocument table) with the ChromaDB vector store.
Ensures that metadata in SQL strictly reflects what is available in the vector index.
"""

import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.legal_document import LegalDocument
from app.core.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def sync_legal_docs_from_chroma():
    """
    Synchronize LegalDocument table with ChromaDB contents.
    1. Fetch all indexed documents from ChromaDB.
    2. Update or Create records in SQL for found documents.
    3. Delete records in SQL that are NOT in ChromaDB.
    """
    logger.info("Starting synchronization of LegalDocument metadata from ChromaDB...")
    
    # 1. Get current state from Vector Store
    try:
        vector_store = get_vector_store()
        # Force refresh to get the latest state from DB on disk
        chroma_docs = vector_store.get_indexed_documents(force_refresh=True)
        logger.info(f"Found {len(chroma_docs)} documents in ChromaDB.")
        
        # Map source_name -> doc_info for easy lookup
        chroma_map = {doc['source_name']: doc for doc in chroma_docs}
        
    except Exception as e:
        logger.error(f"Failed to fetch documents from ChromaDB: {e}")
        return

    # 2. Sync with SQL Database
    db: Session = SessionLocal()
    try:
        # Get all existing SQL records
        start_time = datetime.utcnow()
        existing_sql_docs = db.query(LegalDocument).all()
        existing_sql_map = {doc.source_name: doc for doc in existing_sql_docs}
        
        added_count = 0
        updated_count = 0
        deleted_count = 0
        
        # A. Update or Create
        for source_name, info in chroma_map.items():
            chunk_count = info.get('chunk_count', 0)
            doc_type = info.get('doc_type', 'unknown')
            
            if source_name in existing_sql_map:
                # Update existing
                doc = existing_sql_map[source_name]
                if doc.chunk_count != chunk_count or doc.doc_type != doc_type:
                    doc.chunk_count = chunk_count
                    doc.doc_type = doc_type
                    doc.updated_at = datetime.utcnow()
                    updated_count += 1
            else:
                # Create new
                new_doc = LegalDocument(
                    source_name=source_name,
                    title=source_name.replace(".txt", "").replace("_", " "),
                    doc_type=doc_type,
                    chunk_count=chunk_count,
                    is_indexed=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_doc)
                added_count += 1
        
        # B. Delete records not in Chroma
        for source_name, doc in existing_sql_map.items():
            if source_name not in chroma_map:
                db.delete(doc)
                deleted_count += 1
                
        db.commit()
        
        logger.info(f"Sync complete. Added: {added_count}, Updated: {updated_count}, Deleted: {deleted_count}")
        print(f"✅ Sync complete. Added: {added_count}, Updated: {updated_count}, Deleted: {deleted_count}")

    except Exception as e:
        logger.error(f"Failed to sync with SQL database: {e}")
        print(f"❌ Failed to sync with SQL database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Allow running directly for testing
    logging.basicConfig(level=logging.INFO)
    sync_legal_docs_from_chroma()
