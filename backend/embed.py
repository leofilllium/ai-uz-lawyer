
import os
import sys
import glob
from pathlib import Path
from typing import List, Dict, Any

# Add project root to python path to import app modules
sys.path.append(os.getcwd())


from app.core.vector_store import VectorStore
# from app.core.document_processor import DocumentProcessor
from app.core.uzbek_law_processor import UzbekLawProcessor


def process_txt_files():
    """Process all TXT files in backend/data/laws_txt."""

    # laws_dir = Path("backend/data/laws_txt/laws_txt")
    # Updated path based on user observation or correction if needed, 
    # but based on previous turns, the files are in backend/data/laws_txt/laws_txt
    # However, let's look at the directory structure again if we are unsure.
    # The previous script used: backend/data/laws_txt/laws_txt
    laws_dir = Path("backend/data/laws_txt")


    
    if not laws_dir.exists():
        print(f"Error: Directory {laws_dir} not found.")
        return

    # Initialize components
    print("Initializing VectorStore and UzbekLawProcessor...")
    try:
        vector_store = VectorStore()
        processor = UzbekLawProcessor()
    except Exception as e:
        print(f"Initialization failed: {e}")
        return

    # Find all txt files (recursive)
    txt_files = list(laws_dir.glob("**/*.txt"))
    
    if not txt_files:
        print(f"No .txt files found in {laws_dir}")
        return

    print(f"Found {len(txt_files)} .txt files to process.")
    
    total_added = 0
    
    for file_path in txt_files:
        print(f"Processing: {file_path.name}")
        try:
            # Read text content
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            if not text.strip():
                print(f"  Skipping empty file: {file_path.name}")
                continue
                
            # Create chunks using UzbekLawProcessor
            # Note: The method signature is slightly different in our new class
            chunks, doc_info = processor.process_text_content(text, file_path.name)
            
            if not chunks:
                print(f"  No chunks created for {file_path.name}")
                continue
            
            print(f"  Detected Type: {doc_info['doc_type']}, Articles: {doc_info['article_count']}")
                
            # Add to VectorStore
            added = vector_store.add_documents(chunks)
            total_added += added
            print(f"  Added {added} chunks from {file_path.name}")
            
        except Exception as e:
            print(f"  Error processing {file_path.name}: {e}")

    print(f"\nCompleted! Total document chunks added: {total_added}")

if __name__ == "__main__":
    process_txt_files()
