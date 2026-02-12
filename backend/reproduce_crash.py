"""
Simple reproduction script to test VectorStore initialization.
"""
import sys
import os

# Add project root to python path
sys.path.append(os.getcwd())

print("Ref: 1. Importing VectorStore...")
try:
    from app.core.vector_store import VectorStore
    print("Ref: 2. Import successful.")
except Exception as e:
    print(f"Ref: 2. Import failed: {e}")
    sys.exit(1)

print("Ref: 3. Initializing VectorStore...")
try:
    store = VectorStore()
    print("Ref: 4. VectorStore initialized successfully.")
    print(f"Ref: 5. Collection count: {store.get_document_count()}")
except Exception as e:
    print(f"Ref: 4. Initialization failed: {e}")
    import traceback
    traceback.print_exc()
