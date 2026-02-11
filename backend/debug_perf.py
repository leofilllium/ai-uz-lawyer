
import os
import sys
import time
import asyncio
from pathlib import Path

# Add project root to python path to import app modules
sys.path.append(os.getcwd())

from app.core.vector_store import VectorStore

async def debug_performance():
    print(f"[{time.strftime('%H:%M:%S')}] Starting VectorStore performance check...")
    
    start_init = time.time()
    try:
        store = VectorStore()
        print(f"[{time.strftime('%H:%M:%S')}] VectorStore initialized in {time.time() - start_init:.2f}s")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] ❌ FATAL: VectorStore init failed: {e}")
        return

    print(f"[{time.strftime('%H:%M:%S')}] Counting total documents...")
    try:
        count = store.collection.count()
        print(f"[{time.strftime('%H:%M:%S')}] Total chunks in DB: {count}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] ❌ FATAL: Count failed: {e}")
        return

    print(f"[{time.strftime('%H:%M:%S')}] Starting get_indexed_documents()...")
    start_stats = time.time()
    
    try:
        # Run synchronous method directly for testing logic
        stats = store.get_indexed_documents(force_refresh=True)
        duration = time.time() - start_stats
        
        print(f"[{time.strftime('%H:%M:%S')}] ✅ Stats calculation finished in {duration:.2f}s")
        print(f"[{time.strftime('%H:%M:%S')}] Found {len(stats)} unique sources.")
        
        # Check caching
        print(f"[{time.strftime('%H:%M:%S')}] Checking cache hit speed...")
        start_cache = time.time()
        stats_cached = store.get_indexed_documents()
        print(f"[{time.strftime('%H:%M:%S')}] ✅ Cached result returned in {time.time() - start_cache:.4f}s")
        
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] ❌ FATAL: get_indexed_documents failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_performance())
