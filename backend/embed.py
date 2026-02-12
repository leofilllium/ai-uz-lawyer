
import os
import sys
import glob
import asyncio
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple
from concurrent.futures import ProcessPoolExecutor

# Add project root to python path to import app modules
sys.path.append(os.getcwd())

from app.core.vector_store import VectorStore
# from app.core.document_processor import DocumentProcessor
from app.core.uzbek_law_processor import UzbekLawProcessor
from app.database import SessionLocal
from app.models.legal_document import LegalDocument
from datetime import datetime

# Worker function must be top-level for pickling
def process_single_file(file_path_str: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any], str]:
    """
    Process a single file in a separate process.
    Returns: (chunks, doc_info, error_message)
    """
    try:
        processor = UzbekLawProcessor()
        file_path = Path(file_path_str)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            
        if not text.strip():
            return [], {}, "Empty file"
            
        chunks, doc_info = processor.process_text_content(text, file_path.name)
        return chunks, doc_info, None
    except Exception as e:
        return [], {}, str(e)

async def main():
    """Main async execution function."""
    start_time = time.time()
    
    # laws_dir = Path("backend/data/laws_txt") 
    # Docker path: /app/data/laws_txt
    laws_dir = Path("data/laws_txt")

    if not laws_dir.exists():
        print(f"Error: Directory {laws_dir} not found.")
        return

    print(f"Scanning {laws_dir} for .txt files...")
    txt_files = list(laws_dir.glob("**/*.txt"))
    
    if not txt_files:
        print(f"No .txt files found in {laws_dir}")
        return

    available_cpus = os.cpu_count() or 1
    max_workers = max(2, int(available_cpus * 0.8))
    print(f"Using {max_workers} processes for parsing.")
    
    # Initialize VectorStore in main process
    try:
        vector_store = VectorStore()
    except Exception as e:
        print(f"VectorStore initialization failed: {e}")
        return
    
    loop = asyncio.get_running_loop()
    all_chunks = []
    processed_count = 0
    
    # Check for existing documents to avoid re-processing
    print("Checking for already existing documents in DB...")
    try:
        # Get all source names from DB
        # This might be slow if there are millions, but for thousands it's fine
        existing_docs = await vector_store.aget_indexed_documents()
        existing_sources = {doc['source_name'] for doc in existing_docs}
        print(f"Found {len(existing_sources)} documents already in DB.")
        
        # Filter files
        files_to_process = []
        for f in txt_files:
            if f.name not in existing_sources:
                files_to_process.append(f)
        
        if len(files_to_process) < len(txt_files):
            print(f"Skipping {len(txt_files) - len(files_to_process)} already indexed files.")
            txt_files = files_to_process
            
        if not txt_files:
            print("All files are already indexed! Use --force (not implemented yet) to re-index.")
            return

    except Exception as e:
        print(f"Warning: Could not check existing documents: {e}")
        print("Proceeding with all files...")

    total_files = len(txt_files)
    print(f"Processing {total_files} new files...")
    
    loop = asyncio.get_running_loop()
    all_chunks = []
    processed_count = 0
    
    with ProcessPoolExecutor(max_workers=max_workers) as pool:
        # Create tasks
        tasks = [
            loop.run_in_executor(pool, process_single_file, str(f))
            for f in txt_files
        ]
        
        # Gather results with progress
        to_process = len(tasks)
        pending = tasks
        
        while pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            
            for task in done:
                chunks, doc_info, error = await task
                processed_count += 1
                
                if error:
                    if error != "Empty file":
                        print(f"[{processed_count}/{total_files}] Error: {error}")
                else:
                    if chunks:
                        all_chunks.extend(chunks)
                    
                if processed_count % 10 == 0:
                    print(f"Parsed {processed_count}/{total_files} files...")

    parse_time = time.time() - start_time
    print(f"\nParsing complete in {parse_time:.2f}s.")
    print(f"Total chunks generated: {len(all_chunks)}")
    
    if not all_chunks:
        print("No chunks to embed.")
        return

    # Sync to SQL Database (Metadata)
    print("Syncing metadata to SQL database...")
    db = SessionLocal()
    try:
        # We need to process by document (source_name)
        # Group chunks by source
        docs_metadata = {}
        for chunk in all_chunks:
            src = chunk['metadata']['source']
            if src not in docs_metadata:
                docs_metadata[src] = {
                    'chunk_count': 0,
                    'doc_type': chunk['metadata'].get('doc_type', 'unknown')
                }
            docs_metadata[src]['chunk_count'] += 1

        # Upsert into SQL
        processed_sql = 0
        for source_name, info in docs_metadata.items():
            doc = db.query(LegalDocument).filter(LegalDocument.source_name == source_name).first()
            if doc:
                doc.chunk_count = info['chunk_count']
                doc.updated_at = datetime.utcnow()
            else:
                doc = LegalDocument(
                    source_name=source_name,
                    title=source_name.replace(".txt", "").replace("_", " "),
                    doc_type=info['doc_type'],
                    chunk_count=info['chunk_count'],
                    is_indexed=True
                )
                db.add(doc)
            processed_sql += 1
        
        db.commit()
        print(f"Synced {processed_sql} documents to SQL.")
        
    except Exception as e:
        print(f"Failed to sync metadata to SQL: {e}")
        db.rollback()
    finally:
        db.close()

    # 2. Embed chunks in batches concurrently
    print("Starting embedding process...")
    embedding_start = time.time()
    
    # Optimal batch size for Voyage AI (Max 128)
    BATCH_SIZE = 128 
    # Number of concurrent embedding requests (Voyage typically handles high concurrency well)
    CONCURRENT_REQUESTS = 10
    
    total_added = 0
    
    # Split all chunks into batches
    batches = [all_chunks[i:i + BATCH_SIZE] for i in range(0, len(all_chunks), BATCH_SIZE)]
    total_batches = len(batches)
    print(f"Queueing {total_batches} batches (Concurrency: {CONCURRENT_REQUESTS})...")
    
    # Semaphore to limit concurrency
    sem = asyncio.Semaphore(CONCURRENT_REQUESTS)
    
    async def upload_batch(batch, batch_idx):
        async with sem:
            retries = 0
            max_retries = 5
            backoff = 2
            
            while retries < max_retries:
                try:
                    # VectorStore.aadd_documents wraps add_documents in run_in_threadpool
                    count = await vector_store.aadd_documents(batch, batch_size=BATCH_SIZE)
                    print(f"  [Batch {batch_idx+1}/{total_batches}] Indexed {count} chunks")
                    return count
                except Exception as e:
                    error_msg = str(e).lower()
                    if "rate limit" in error_msg or "429" in error_msg:
                        wait_time = backoff ** retries
                        print(f"  [Batch {batch_idx+1}/{total_batches}] Rate limit hit. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        retries += 1
                    else:
                        print(f"  [Batch {batch_idx+1}/{total_batches}] FAILED: {e}")
                        return 0
            
            print(f"  [Batch {batch_idx+1}/{total_batches}] FAILED after {max_retries} retries.")
            return 0

    # Create upload tasks
    upload_tasks = [upload_batch(b, i) for i, b in enumerate(batches)]
    
    # Run upload tasks
    results = await asyncio.gather(*upload_tasks)
    total_added = sum(results)
    
    total_time = time.time() - start_time
    print(f"\n✅ DONE! Embedded {total_added} chunks in {total_time:.2f}s")
    print(f"Average speed: {total_added / total_time:.1f} chunks/sec")

if __name__ == "__main__":
    asyncio.run(main())
