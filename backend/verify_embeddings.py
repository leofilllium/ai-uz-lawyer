
import os
import sys
from pathlib import Path

# Add project root to python path
sys.path.append(os.getcwd())

from app.core.vector_store import VectorStore

def verify_embeddings():
    print("Connecting to VectorStore...")
    try:
        store = VectorStore()
        count = store.get_document_count()
        print(f"Total documents in ChromaDB: {count}")
        
        # Get all docs to inspect metadata
        sources = store.get_indexed_documents()
        txt_sources = [s for s in sources if s['source_name'].endswith('.txt')]
        
        print(f"Found {len(txt_sources)} distinct .txt sources.")
        
        # We need to query to get actual metadata details since get_indexed_documents only gives stats
        # Let's peek at a few random documents from the collection
        print("\n--- Inspecting Sample Metadata ---")
        
        # Get random items
        results = store.collection.get(limit=10, include=["metadatas", "documents"])
        
        if results and results["metadatas"]:
            for i, metadata in enumerate(results["metadatas"]):
                source = metadata.get("source", "")
                if source.endswith(".txt"):
                    print(f"\nSource: {source}")
                    print(f"  Type: {metadata.get('doc_type', 'N/A')}")
                    print(f"  Section: {metadata.get('section', 'N/A')}")
                    print(f"  Chapter: {metadata.get('chapter', 'N/A')}")
                    print(f"  Article: {metadata.get('article_display', 'N/A')}")
                    print(f"  Snippet: {results['documents'][i][:50]}...")

    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify_embeddings()
