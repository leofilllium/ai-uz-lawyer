
import os
import sys
import asyncio
from pathlib import Path

# Add project root to python path to import app modules
sys.path.append(os.getcwd())

from app.core.vector_store import VectorStore

async def test_vector_store():
    print("Testing VectorStore fixes...")
    try:
        store = VectorStore()
        print("VectorStore initialized successfully (Dimension check passed).")
        
        print("Fetching indexed documents with pagination...")
        docs = await store.aget_indexed_documents()
        print(f"Successfully retrieved {len(docs)} source documents.")
        
        if docs:
            print(f"Sample doc: {docs[0]['source_name']} (chunks: {docs[0]['chunk_count']})")
            
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_vector_store())
