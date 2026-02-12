"""
Granular debug script to isolate the crash in VectorStore initialization.
Run this inside the docker container: 
docker compose exec backend python check_chroma_crash.py
"""
import sys
import os
import time

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print("DEBUG: Starting check_chroma_crash.py", flush=True)

# Add project root to python path
sys.path.append(os.getcwd())
print(f"DEBUG: CWD: {os.getcwd()}", flush=True)

print("DEBUG: Importing chromadb...", flush=True)
try:
    import chromadb
    from chromadb.config import Settings
    print(f"DEBUG: chromadb imported. Version: {chromadb.__version__}", flush=True)
except Exception as e:
    print(f"FATAL: chromadb import failed: {e}", flush=True)
    sys.exit(1)

print("DEBUG: Importing langchain_openai...", flush=True)
try:
    from langchain_openai import OpenAIEmbeddings
    print("DEBUG: langchain_openai imported.", flush=True)
except Exception as e:
    print(f"FATAL: langchain_openai import failed: {e}", flush=True)
    sys.exit(1)

print("DEBUG: Importing app.config...", flush=True)
try:
    from app.config import get_settings
    settings = get_settings()
    print("DEBUG: Settings loaded.", flush=True)
except Exception as e:
    print(f"FATAL: app.config import failed: {e}", flush=True)
    sys.exit(1)

print("DEBUG: Initializing ChromaDB PersistentClient...", flush=True)
db_path = settings.chroma_db_path
print(f"DEBUG: DB Path: {db_path}", flush=True)

try:
    if not os.path.exists(db_path):
        print(f"DEBUG: Creating directory {db_path}", flush=True)
        os.makedirs(db_path, exist_ok=True)
    
    client = chromadb.PersistentClient(
        path=db_path,
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True,
        )
    )
    print("DEBUG: ChromaDB Client initialized.", flush=True)
    print("DEBUG: Heartbeat: " + str(client.heartbeat()), flush=True)
except Exception as e:
    print(f"FATAL: ChromaDB Client init failed: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("DEBUG: Initializing OpenAIEmbeddings...", flush=True)
try:
    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        openai_api_key=settings.openai_api_key,
    )
    print("DEBUG: OpenAIEmbeddings initialized.", flush=True)
except Exception as e:
    print(f"FATAL: OpenAIEmbeddings init failed: {e}", flush=True)
    sys.exit(1)

print("DEBUG: Getting/Creating Collection...", flush=True)
try:
    collection = client.get_or_create_collection(
        name="uzbekistan_legal_codes",
        metadata={
            "description": "Uzbekistan Legal Codes",
            "hnsw:space": "cosine"
        }
    )
    print("DEBUG: Collection retrieved.", flush=True)
    print(f"DEBUG: Collection count: {collection.count()}", flush=True)
except Exception as e:
    print(f"FATAL: Collection init failed: {e}", flush=True)
    sys.exit(1)

print("DEBUG: Test Complete - No Crashes.", flush=True)
