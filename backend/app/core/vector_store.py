"""
Vector Store Module
ChromaDB integration for storing and searching legal document embeddings.
Migrated to work with FastAPI.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional

from starlette.concurrency import run_in_threadpool
import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings

from app.config import get_settings


class VectorStore:
    """ChromaDB-based vector store for legal document retrieval."""
    
    def __init__(self, persist_directory: Optional[Path] = None):
        settings = get_settings()
        
        self.persist_directory = persist_directory or Path(settings.chroma_db_path)
        
        # Ensure directory exists
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True,
            )
        )
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.openai_embedding_model,
            openai_api_key=settings.openai_api_key,
        )
        
        # Get or create collection with cosine similarity
        self.collection = self.client.get_or_create_collection(
            name="uzbekistan_legal_codes",
            metadata={
                "description": "Uzbekistan Legal Codes",
                "hnsw:space": "cosine"
            }
        )
        
        # Check for dimension mismatch (migration from 1536 -> 3072)
        try:
            # Peek at one item to check dimensionality
            existing_items = self.collection.peek(limit=1)
            if existing_items and existing_items['embeddings'] and len(existing_items['embeddings']) > 0:
                current_dim = len(existing_items['embeddings'][0])
                target_dim = 3072 if "3-large" in settings.openai_embedding_model else 1536
                
                if current_dim != target_dim:
                    print(f"⚠️ DETECTED DIMENSION MISMATCH: DB={current_dim}, Model={target_dim}")
                    print("⚠️ CLEARING COLLECTION FOR RE-INDEXING...")
                    self.clear_collection()
                    print("✅ Collection cleared and ready for new embeddings")
        except Exception as e:
            print(f"⚠️ Warning during dimension check: {e}")
    
    def add_documents(self, chunks: List[Dict[str, Any]], batch_size: int = 100) -> int:
        """Add document chunks to the vector store."""
        if not chunks:
            return 0
        
        total_added = 0
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            ids = []
            documents = []
            metadatas = []
            
            for chunk in batch:
                content = chunk["content"]
                metadata = chunk["metadata"]
                
                doc_id = chunk.get("id", str(hash(content + str(metadata))))
                
                clean_metadata = {
                    "source": str(metadata.get("source", "unknown")),
                    "article_number": str(metadata.get("article_number", "unknown")),
                    "article_display": str(metadata.get("article_display", "unknown")),
                    "chapter": str(metadata.get("chapter", "General"))[:500],
                    "chapter_num": str(metadata.get("chapter_num", "")),
                    "section": str(metadata.get("section", ""))[:200],
                    "title": str(metadata.get("title", ""))[:300],
                    "chunk_index": int(metadata.get("chunk_index", 0)),
                    "total_chunks": int(metadata.get("total_chunks", 1)),
                }
                
                ids.append(doc_id)
                documents.append(content)
                metadatas.append(clean_metadata)
            
            try:
                embeddings = self.embeddings.embed_documents(documents)
                
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas,
                )
                
                total_added += len(batch)
                print(f"Added batch {i // batch_size + 1}: {len(batch)} documents")
                
            except Exception as e:
                print(f"Error adding batch: {e}")
                raise
        
        return total_added
    
    def search(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using semantic search."""
        query_embedding = self.embeddings.embed_query(query)
        
        where = filter_metadata if filter_metadata else None
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        
        formatted_results = []
        
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                
                formatted_results.append({
                    "content": doc,
                    "metadata": metadata,
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                    "similarity": 1 - (results["distances"][0][i] if results["distances"] else 0),
                })
        
        return formatted_results
    
    def get_document_count(self) -> int:
        """Return the number of documents in the collection."""
        return self.collection.count()
    
    def clear_collection(self) -> None:
        """Clear all documents from the collection."""
        self.client.delete_collection("uzbekistan_legal_codes")
        self.collection = self.client.get_or_create_collection(
            name="uzbekistan_legal_codes",
            metadata={"description": "Uzbekistan Legal Codes"}
        )
    
    def is_indexed(self) -> bool:
        """Check if documents have been indexed."""
        return self.get_document_count() > 0

    async def aadd_documents(self, chunks: List[Dict[str, Any]], batch_size: int = 100) -> int:
        """Async version of add_documents."""
        return await run_in_threadpool(self.add_documents, chunks, batch_size)

    async def asearch(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Async version of search."""
        return await run_in_threadpool(self.search, query, top_k, filter_metadata)

    async def ais_indexed(self) -> bool:
        """Async version of is_indexed."""
        return await run_in_threadpool(self.is_indexed)
