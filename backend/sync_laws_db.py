"""
Script to manually sync SQL LegalDocument table with ChromaDB content.
"""

import os
import sys

# Add project root to python path to import app modules
sys.path.append(os.getcwd())

from app.core.sync_service import sync_legal_docs_from_chroma

if __name__ == "__main__":
    print("Starting manual sync of LegalDocument metadata...")
    try:
        sync_legal_docs_from_chroma()
        print("✅ Manual sync completed successfully.")
    except Exception as e:
        print(f"❌ Manual sync failed: {e}")
