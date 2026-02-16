"""
Vector Store Module
ChromaDB integration with hybrid search (semantic + BM25) for legal document retrieval.
"""

import re
import time as _time
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from starlette.concurrency import run_in_threadpool
import chromadb
from chromadb.config import Settings
from langchain_voyageai import VoyageAIEmbeddings
from rank_bm25 import BM25Okapi

from app.config import get_settings

logger = logging.getLogger(__name__)


# ─── Uzbek-aware tokenizer ────────────────────────────────────────────────
# Uzbek Latin has special chars: oʻ, gʻ, sh, ch — we keep them intact
_UZBEK_TOKEN_PATTERN = re.compile(r"[a-zA-ZoʻgʻOʻGʻ'ʼ]+", re.UNICODE)


def tokenize_uzbek(text: str) -> List[str]:
    """Tokenize Uzbek Latin text, preserving special characters."""
    return [t.lower() for t in _UZBEK_TOKEN_PATTERN.findall(text) if len(t) > 1]


class BM25Index:
    """Lazy-built BM25 index over ChromaDB documents."""

    def __init__(self):
        self._bm25: Optional[BM25Okapi] = None
        self._doc_ids: List[str] = []
        self._doc_texts: List[str] = []
        self._doc_metadatas: List[Dict[str, Any]] = []
        self._corpus: List[List[str]] = []
        self._build_time: float = 0
        self._doc_count_at_build: int = 0

    @property
    def is_built(self) -> bool:
        return self._bm25 is not None

    def needs_rebuild(self, current_count: int) -> bool:
        """Check if index needs rebuilding (new docs added)."""
        if not self.is_built:
            return True
        # Rebuild if >5% new documents or it's been >10 minutes
        count_diff = abs(current_count - self._doc_count_at_build)
        time_diff = _time.time() - self._build_time
        return count_diff > self._doc_count_at_build * 0.05 or time_diff > 600

    def build(self, collection) -> None:
        """Build BM25 index from ChromaDB collection."""
        total = collection.count()
        if total == 0:
            logger.warning("BM25: No documents to index")
            return

        logger.info(f"BM25: Building index over {total} documents...")
        start = _time.time()

        all_ids = []
        all_texts = []
        all_metadatas = []
        batch_size = 5000

        for offset in range(0, total, batch_size):
            batch = collection.get(
                include=["documents", "metadatas"],
                limit=batch_size,
                offset=offset,
            )
            if batch and batch["ids"]:
                all_ids.extend(batch["ids"])
                all_texts.extend(batch["documents"] or [])
                all_metadatas.extend(batch["metadatas"] or [])

        # Tokenize corpus
        corpus = [tokenize_uzbek(text) for text in all_texts]

        self._bm25 = BM25Okapi(corpus)
        self._doc_ids = all_ids
        self._doc_texts = all_texts
        self._doc_metadatas = all_metadatas
        self._corpus = corpus
        self._build_time = _time.time()
        self._doc_count_at_build = total

        elapsed = self._build_time - start
        logger.info(f"BM25: Index built in {elapsed:.2f}s ({total} docs)")

    def search(self, query: str, top_k: int = 60) -> List[Dict[str, Any]]:
        """Search using BM25 keyword matching."""
        if not self.is_built:
            return []

        tokens = tokenize_uzbek(query)
        if not tokens:
            return []

        scores = self._bm25.get_scores(tokens)

        # Get top-k indices by score
        scored_indices = sorted(
            enumerate(scores), key=lambda x: x[1], reverse=True
        )[:top_k]

        results = []
        for idx, score in scored_indices:
            if score <= 0:
                continue
            results.append({
                "content": self._doc_texts[idx],
                "metadata": self._doc_metadatas[idx] if idx < len(self._doc_metadatas) else {},
                "bm25_score": float(score),
                "doc_id": self._doc_ids[idx],
            })

        return results


class VectorStore:
    """ChromaDB-based vector store with hybrid search for legal document retrieval."""

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

        # Initialize Embeddings
        if settings.embedding_provider == "voyage":
            self.embeddings = VoyageAIEmbeddings(
                model=settings.embedding_model,
                voyage_api_key=settings.voyage_api_key,
            )
        else:
            from langchain_openai import OpenAIEmbeddings
            self.embeddings = OpenAIEmbeddings(
                model=settings.embedding_model if hasattr(settings, 'embedding_model') else "text-embedding-3-large",
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

        # BM25 keyword index (lazy-built)
        self._bm25_index = BM25Index()

        # Cache for get_indexed_documents
        self._indexed_docs_cache: List[Dict[str, Any]] = []
        self._indexed_docs_cache_time: float = 0
        self._cache_ttl: float = 60  # seconds

        # Voyage reranker (lazy-initialized)
        self._reranker = None
        self._voyage_api_key = settings.voyage_api_key

        # Dimension check
        self._check_dimensions(settings)

    def _check_dimensions(self, settings):
        """Check for dimension mismatch and clear if needed."""
        try:
            existing_items = self.collection.peek(limit=1)
            if (existing_items and existing_items.get('embeddings') is not None
                    and len(existing_items['embeddings']) > 0):
                current_dim = len(existing_items['embeddings'][0])
                target_dim = 1024 if settings.embedding_provider == "voyage" else 3072
                if current_dim != target_dim:
                    print(f"⚠️ DIMENSION MISMATCH: DB={current_dim}, Model={target_dim}")
                    print("⚠️ CLEARING COLLECTION FOR RE-INDEXING...")
                    self.clear_collection()
                    print("✅ Collection cleared and ready for new embeddings")
        except Exception as e:
            print(f"⚠️ Warning during dimension check: {e}")

    def _ensure_bm25_index(self) -> None:
        """Ensure BM25 index is built and up to date."""
        current_count = self.collection.count()
        if current_count == 0:
            return
        if self._bm25_index.needs_rebuild(current_count):
            self._bm25_index.build(self.collection)

    def _get_reranker(self):
        """Lazy-initialize Voyage reranker."""
        if self._reranker is None:
            try:
                import voyageai
                self._reranker = voyageai.Client(api_key=self._voyage_api_key)
                logger.info("Voyage reranker initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Voyage reranker: {e}")
        return self._reranker

    # ─── Core search methods ──────────────────────────────────────────

    def semantic_search(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Pure semantic search via ChromaDB cosine similarity."""
        query_embedding = self.embeddings.embed_query(query)

        where = filter_metadata if filter_metadata else None

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        formatted = []
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0
                formatted.append({
                    "content": doc,
                    "metadata": metadata,
                    "distance": distance,
                    "similarity": 1 - distance,
                })
        return formatted

    def keyword_search(
        self,
        query: str,
        top_k: int = 60
    ) -> List[Dict[str, Any]]:
        """BM25 keyword search over documents."""
        self._ensure_bm25_index()
        return self._bm25_index.search(query, top_k)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None,
        semantic_weight: float = 0.6,
        keyword_weight: float = 0.4,
        rrf_k: int = 60,
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search: Semantic + BM25 with Reciprocal Rank Fusion.

        Args:
            query: Search query text
            top_k: Number of results to return
            filter_metadata: Optional ChromaDB metadata filter
            semantic_weight: Weight for semantic results in RRF (0-1)
            keyword_weight: Weight for keyword results in RRF (0-1)
            rrf_k: RRF constant (higher = more uniform ranking)
        """
        # Fetch more candidates than needed for merging
        candidate_k = min(top_k * 3, 200)

        # 1. Semantic search
        semantic_results = self.semantic_search(query, candidate_k, filter_metadata)

        # 2. BM25 keyword search
        keyword_results = self.keyword_search(query, candidate_k)

        # 3. Reciprocal Rank Fusion
        merged = self._reciprocal_rank_fusion(
            semantic_results,
            keyword_results,
            semantic_weight=semantic_weight,
            keyword_weight=keyword_weight,
            rrf_k=rrf_k,
        )

        return merged[:top_k]

    def rerank(
        self,
        query: str,
        results: List[Dict[str, Any]],
        top_k: int = 30,
    ) -> List[Dict[str, Any]]:
        """
        Re-rank results using Voyage AI reranker for higher precision.

        Falls back to original ordering if reranker is unavailable.
        """
        if not results:
            return results

        reranker = self._get_reranker()
        if reranker is None:
            return results[:top_k]

        try:
            documents = [r.get("content", "") for r in results]

            # Voyage rerank API
            reranking = reranker.rerank(
                query=query,
                documents=documents,
                model="rerank-2",
                top_k=min(top_k, len(documents)),
            )

            reranked = []
            for item in reranking.results:
                original = results[item.index]
                original["rerank_score"] = item.relevance_score
                # Blend rerank score with existing similarity
                existing_sim = original.get("similarity", 0)
                # Weighted blend: 70% rerank, 30% original similarity
                original["similarity"] = 0.7 * item.relevance_score + 0.3 * existing_sim
                reranked.append(original)

            logger.info(f"Reranked {len(reranked)} results (top score: {reranked[0]['similarity']:.3f})")
            return reranked

        except Exception as e:
            logger.warning(f"Reranking failed, using original order: {e}")
            return results[:top_k]

    def _reciprocal_rank_fusion(
        self,
        semantic_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]],
        semantic_weight: float = 0.6,
        keyword_weight: float = 0.4,
        rrf_k: int = 60,
    ) -> List[Dict[str, Any]]:
        """
        Merge two result sets using Reciprocal Rank Fusion.

        RRF score = weight * (1 / (k + rank))

        This approach is robust to different score distributions between
        semantic and keyword search.
        """
        # Track by content hash for deduplication
        fused_scores: Dict[str, Dict[str, Any]] = {}

        def _content_key(result: Dict[str, Any]) -> str:
            """Create unique key from content + metadata."""
            meta = result.get("metadata", {})
            content = result.get("content", "")
            return f"{meta.get('source', '')}_{meta.get('article_display', '')}_{hash(content[:200])}"

        # Score semantic results
        for rank, result in enumerate(semantic_results):
            key = _content_key(result)
            rrf_score = semantic_weight * (1.0 / (rrf_k + rank + 1))

            if key not in fused_scores:
                fused_scores[key] = {
                    **result,
                    "rrf_score": rrf_score,
                    "semantic_rank": rank + 1,
                    "keyword_rank": None,
                    "original_similarity": result.get("similarity", 0),
                }
            else:
                fused_scores[key]["rrf_score"] += rrf_score
                fused_scores[key]["semantic_rank"] = rank + 1

        # Score keyword results
        for rank, result in enumerate(keyword_results):
            key = _content_key(result)
            rrf_score = keyword_weight * (1.0 / (rrf_k + rank + 1))

            if key not in fused_scores:
                fused_scores[key] = {
                    **result,
                    "rrf_score": rrf_score,
                    "semantic_rank": None,
                    "keyword_rank": rank + 1,
                    "original_similarity": result.get("similarity", 0),
                }
            else:
                fused_scores[key]["rrf_score"] += rrf_score
                fused_scores[key]["keyword_rank"] = rank + 1

        # Sort by fused RRF score
        merged = sorted(fused_scores.values(), key=lambda x: x["rrf_score"], reverse=True)

        # Normalize RRF scores to 0-1 range for consistency with similarity field
        if merged:
            max_rrf = merged[0]["rrf_score"]
            for item in merged:
                # Use RRF-normalized score as the new similarity
                item["similarity"] = item["rrf_score"] / max_rrf if max_rrf > 0 else 0

        return merged

    # ─── Legacy search method (backward compatible) ───────────────────

    def search(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents. Now uses hybrid search by default."""
        return self.hybrid_search(query, top_k, filter_metadata)

    # ─── Document management ──────────────────────────────────────────

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

        # Invalidate BM25 index after adding documents
        self._bm25_index = BM25Index()

        return total_added

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
        self._bm25_index = BM25Index()

    def is_indexed(self) -> bool:
        """Check if documents have been indexed."""
        return self.get_document_count() > 0

    def get_indexed_documents(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Get list of all indexed source documents with their chunk counts."""
        now = _time.time()
        if not force_refresh and self._indexed_docs_cache and (now - self._indexed_docs_cache_time) < self._cache_ttl:
            return self._indexed_docs_cache

        total_count = self.collection.count()
        if total_count == 0:
            self._indexed_docs_cache = []
            self._indexed_docs_cache_time = now
            return []

        source_stats: Dict[str, Dict[str, Any]] = {}
        batch_size = 2000
        offset = 0

        while offset < total_count:
            try:
                batch = self.collection.get(
                    include=["metadatas"],
                    limit=batch_size,
                    offset=offset
                )
                if batch and batch["metadatas"]:
                    for metadata in batch["metadatas"]:
                        if not metadata:
                            continue
                        source = metadata.get("source", "unknown")
                        if source not in source_stats:
                            source_stats[source] = {
                                "source_name": source,
                                "chunk_count": 0,
                                "doc_type": metadata.get("doc_type", "unknown"),
                            }
                        source_stats[source]["chunk_count"] += 1
                offset += batch_size
            except Exception as e:
                print(f"Error fetching batch at offset {offset}: {e}")
                break

        result = list(source_stats.values())
        self._indexed_docs_cache = result
        self._indexed_docs_cache_time = now
        return result

    def is_document_indexed(self, source_name: str) -> bool:
        """Check if a specific document is already indexed."""
        results = self.collection.get(
            where={"source": source_name},
            limit=1,
        )
        return bool(results and results["ids"])

    def remove_document(self, source_name: str) -> int:
        """Remove all chunks from a specific source document."""
        results = self.collection.get(
            where={"source": source_name},
        )

        if not results or not results["ids"]:
            return 0

        ids_to_delete = results["ids"]
        self.collection.delete(ids=ids_to_delete)
        self._bm25_index = BM25Index()  # Invalidate

        print(f"Removed {len(ids_to_delete)} chunks from source: {source_name}")
        return len(ids_to_delete)

    # ─── Async wrappers ───────────────────────────────────────────────

    async def aadd_documents(self, chunks: List[Dict[str, Any]], batch_size: int = 100) -> int:
        return await run_in_threadpool(self.add_documents, chunks, batch_size)

    async def asearch(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        return await run_in_threadpool(self.search, query, top_k, filter_metadata)

    async def ahybrid_search(
        self,
        query: str,
        top_k: int = 60,
        filter_metadata: Optional[Dict[str, Any]] = None,
        semantic_weight: float = 0.6,
        keyword_weight: float = 0.4,
    ) -> List[Dict[str, Any]]:
        return await run_in_threadpool(
            self.hybrid_search, query, top_k, filter_metadata,
            semantic_weight, keyword_weight
        )

    async def arerank(
        self,
        query: str,
        results: List[Dict[str, Any]],
        top_k: int = 30,
    ) -> List[Dict[str, Any]]:
        return await run_in_threadpool(self.rerank, query, results, top_k)

    async def ais_indexed(self) -> bool:
        return await run_in_threadpool(self.is_indexed)

    async def aget_indexed_documents(self) -> List[Dict[str, Any]]:
        return await run_in_threadpool(self.get_indexed_documents)

    async def ais_document_indexed(self, source_name: str) -> bool:
        return await run_in_threadpool(self.is_document_indexed, source_name)

    async def aremove_document(self, source_name: str) -> int:
        return await run_in_threadpool(self.remove_document, source_name)


# Global singleton instance
_vector_store_instance: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get or create singleton VectorStore instance."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStore()
    return _vector_store_instance
