"""
Debug script to check if a FRESH ChromaDB instance works.
This helps determine if the issue is DB corruption or Environment/Library failure.
Run this inside the docker container:
docker compose exec backend python check_fresh_chroma.py
"""
import sys
import os
import shutil
import tempfile
import chromadb
from chromadb.config import Settings

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print("DEBUG: Starting check_fresh_chroma.py", flush=True)

# Create a temporary directory for the fresh DB
temp_dir = tempfile.mkdtemp()
print(f"DEBUG: Created temp DB dir: {temp_dir}", flush=True)

try:
    print("DEBUG: Initializing Fresh ChromaDB PersistentClient...", flush=True)
    client = chromadb.PersistentClient(
        path=temp_dir,
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True,
        )
    )
    print("DEBUG: Client initialized.", flush=True)
    print("DEBUG: Heartbeat: " + str(client.heartbeat()), flush=True)
    
    print("DEBUG: Creating fresh collection...", flush=True)
    collection = client.create_collection(name="test_collection")
    print("DEBUG: Collection created.", flush=True)
    
    print("DEBUG: Adding a dummy document...", flush=True)
    collection.add(
        documents=["This is a test document"],
        metadatas=[{"source": "test"}],
        ids=["id1"]
    )
    print("DEBUG: Document added.", flush=True)
    
    count = collection.count()
    print(f"DEBUG: Collection count: {count}", flush=True)
    
    if count == 1:
        print("SUCCESS: Fresh ChromaDB works perfectly!", flush=True)
        print("CONCLUSION: The existng 'chroma_db' folder is likely CORRUPTED.", flush=True)
    else:
        print(f"FAILURE: Count mismatch. Expected 1, got {count}", flush=True)

except Exception as e:
    print(f"FATAL: Fresh DB Test failed: {e}", flush=True)
    import traceback
    traceback.print_exc()

finally:
    # Cleanup
    print("DEBUG: Cleaning up temp dir...", flush=True)
    shutil.rmtree(temp_dir)
    print("DEBUG: Cleanup done.", flush=True)
