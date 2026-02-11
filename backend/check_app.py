
import sys
import os

# Add project root to python path
sys.path.append(os.getcwd())

print("Attempting to import app.main...")
try:
    from app.main import app
    print("✅ Successfully imported app.main")
except Exception as e:
    print(f"❌ Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()

print("Attempting to initialize VectorStore...")
try:
    from app.core.vector_store import VectorStore
    # Dry run init
    # vs = VectorStore() 
    # Don't actually init if it's heavy, just import
    print("✅ Successfully imported VectorStore")
except Exception as e:
    print(f"❌ Failed to import VectorStore: {e}")
