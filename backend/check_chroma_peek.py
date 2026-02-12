"""
Debug script to check if we can read ANY data without crashing, avoiding .count()
Run this inside the docker container: 
docker compose exec backend python check_chroma_peek.py
"""
import sys
import os
import chromadb
from chromadb.config import Settings

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print("DEBUG: Starting check_chroma_peek.py", flush=True)

# Add project root
sys.path.append(os.getcwd())

from app.config import get_settings
settings = get_settings()

try:
    print("DEBUG: Initializing ChromaDB...", flush=True)
    client = chromadb.PersistentClient(
        path=settings.chroma_db_path,
        settings=Settings(anonymized_telemetry=False, allow_reset=True)
    )
    
    collection = client.get_or_create_collection(name="uzbekistan_legal_codes")
    print("DEBUG: Collection retrieved.", flush=True)
    
    # SKIP count() since it crashes
    # try:
    #     print(f"DEBUG: Count: {collection.count()}")
    # except:
    #     print("DEBUG: Count failed!")

    print("DEBUG: Attempting .peek() / .get(limit=1)...", flush=True)
    items = collection.get(limit=1)
    
    if items and items['ids']:
        print(f"DEBUG: Success! Found item ID: {items['ids'][0]}", flush=True)
        print("CONCLUSION: partial read works. We can switch to iterative indexing.", flush=True)
    else:
        print("DEBUG: Collection seems empty or read failed.", flush=True)

except Exception as e:
    print(f"FATAL: {e}", flush=True)
    import traceback
    traceback.print_exc()
