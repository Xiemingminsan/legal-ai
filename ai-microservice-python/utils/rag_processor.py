# rag_system.py
from enum import global_str
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import spacy
from sentence_transformers import SentenceTransformer
import faiss
from functools import lru_cache
import re
from dataclasses import dataclass
from rank_bm25 import BM25Okapi
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from pathlib import Path
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ChunkMetadata:
    """Metadata for each chunk including original text and search-related info."""
    doc_id: str
    chunk_id: int
    original_text: str
    processed_text: str
    embedding_idx: int
    special_matches: Dict[str, List[str]]

class RAGProcessor:
    """
    Optimized RAG processor with hybrid search (BM25 + FAISS), 
    efficient caching, and smart chunking.
    """
    def __init__(
        self,
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        batch_size: int = 32,
        cache_dir: Optional[str] = None,
        faiss_index: Optional[Any] = None
    ):
        # Initialize spacy for text processing
        self.nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
        self.nlp.add_pipe("sentencizer")
        
        # Initialize embedding model with caching
        self.embedding_model = self._initialize_embedding_model(embedding_model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        self.batch_size = batch_size
        
        # Initialize FAISS index
        self.index = faiss_index if faiss_index is not None else faiss.IndexFlatIP(self.embedding_dim)
        
        
        # Initialize BM25
        self.tokenized_texts: List[List[str]] = []  # Store all tokenized texts
        self.bm25: Optional[BM25Okapi] = None  # Will be initialized when we have documents
        self.chunks_metadata: List[ChunkMetadata] = []
        
        # Patterns for special matching
        self.special_patterns = {
            "article_ref": re.compile(r'article\s+\d+(\.\d+)*'),
            "section_ref": re.compile(r'section\s+\d+(\.\d+)*'),
            "legal_refs": re.compile(r'(?:pursuant to|in accordance with|subject to)'),
            "definitions": re.compile(r'(?:means|refers to|is defined as)')
        }
        
        # Thread pool for parallel processing
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Cache directory setup
        self.cache_dir = Path(cache_dir) if cache_dir else None
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _initialize_embedding_model(self, model_name: str) -> SentenceTransformer:
        """Initialize the embedding model with caching."""
        return SentenceTransformer(model_name)

    @lru_cache(maxsize=1024)
    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for a single text with caching."""
        return self.embedding_model.encode([text])[0]
    
    def update_index(self, new_index):
        """Update the FAISS index reference"""
        self.index = new_index

    def update_bm25(self, corpus):
        if corpus:
            self.bm25 = BM25Okapi(corpus)
        else:
            self.bm25 = BM25Okapi([["placeholder"]])  # Fallback


    async def process_document(self, doc_id: str, text: str) -> Dict[str, Any]:
        """Process a document asynchronously with smart chunking and parallel processing."""
        try:
            # Generate chunks with proper boundaries
            chunks = await self._generate_smart_chunks(text)
            logger.info(f"Generated {len(chunks)} chunks for document {doc_id}")

            # Process chunks in parallel
            chunk_data = await self._process_chunks(doc_id, chunks)
            
            # Update search indices
            self._update_search_indices(chunk_data)
            
            # Store the processed chunks metadata
            self.chunks_metadata.extend(chunk_data)  # Add this line
            
            # Return processed data
            return {
                "doc_id": doc_id,
                "num_chunks": len(chunks),
                "success": True,
                "metadata": self._generate_doc_metadata(chunk_data),
                "chunk_data": [
                    {
                        "doc_id": chunk.doc_id,
                        "chunk_id": chunk.chunk_id,
                        "original_text": chunk.original_text,
                        "processed_text": chunk.processed_text,
                        "embedding_idx": chunk.embedding_idx,
                        "special_matches": chunk.special_matches
                    }
                    for chunk in chunk_data
                ]
            }

        except Exception as e:
            logger.error(f"Error processing document {doc_id}: {e}")
            raise

        
    async def _generate_smart_chunks(self, text: str, max_chunk_size: int = 512) -> List[str]:
        """
        Generate chunks with intelligent boundary detection that keeps related content together.
        """
        def chunk_generator():
            doc = self.nlp(text)
            current_chunk = []
            current_length = 0
            current_article = None
            
            for sent in doc.sents:
                sent_text = sent.text.strip()
                sent_length = len(sent)
                
                # Check if this sentence starts a new article
                article_match = self.special_patterns["article_ref"].match(sent_text)
                
                # Decision logic for chunking
                should_start_new_chunk = False
                
                if article_match:
                    # If we're starting a new article and have content, finish current chunk
                    if current_chunk:
                        should_start_new_chunk = True
                    current_article = article_match.group()
                else:
                    # For non-article-starting sentences, check size limits
                    if current_length + sent_length > max_chunk_size:
                        # Before creating a new chunk, look ahead to see if this sentence
                        # is part of a list or continuing content
                        is_list_item = bool(re.match(r'^\d+\.', sent_text))
                        is_continuing = bool(re.match(r'^[a-z]', sent_text))
                        
                        # If it's a list item or continuing content and we haven't exceeded
                        # max_chunk_size by too much, keep it in current chunk
                        if (is_list_item or is_continuing) and current_length + sent_length < max_chunk_size * 1.5:
                            should_start_new_chunk = False
                        else:
                            should_start_new_chunk = True
                
                # Handle chunk creation
                if should_start_new_chunk and current_chunk:
                    yield " ".join(current_chunk)
                    current_chunk = []
                    current_length = 0
                
                # Add the current sentence to the chunk
                if article_match:
                    # For article headers, include context from previous chunk if it exists
                    context_window = 2  # Number of sentences to include for context
                    if current_chunk and len(current_chunk) > context_window:
                        context = current_chunk[-context_window:]
                        current_chunk = context + [sent_text]
                        current_length = sum(len(s) for s in current_chunk)
                    else:
                        current_chunk.append(sent_text)
                        current_length = sent_length
                else:
                    current_chunk.append(sent_text)
                    current_length += sent_length
            
            # Don't forget the last chunk
            if current_chunk:
                yield " ".join(current_chunk)

        # Process in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        chunks = await loop.run_in_executor(self.executor, 
                                        lambda: list(chunk_generator()))
        return chunks

    async def _process_chunks(
        self, 
        doc_id: str, 
        chunks: List[str]
    ) -> List[ChunkMetadata]:
        """Process chunks in parallel."""
        async def process_chunk(chunk: str, chunk_id: int) -> ChunkMetadata:
            # Clean and process text
            processed_text = await self._clean_text(chunk)
            
            # Find special matches
            special_matches = {
                name: pattern.findall(chunk)
                for name, pattern in self.special_patterns.items()
            }
            
            return ChunkMetadata(
                doc_id=doc_id,
                chunk_id=chunk_id,
                original_text=chunk,
                processed_text=processed_text,
                embedding_idx=len(self.chunks_metadata) + chunk_id,
                special_matches=special_matches
            )

        # Process all chunks in parallel
        tasks = [
            process_chunk(chunk, i) 
            for i, chunk in enumerate(chunks)
        ]
        return await asyncio.gather(*tasks)

    async def _clean_text(self, text: str) -> str:
        """Clean text while preserving important patterns."""
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self._clean_text_sync, text)

    def _clean_text_sync(self, text: str) -> str:
        """Synchronous version of text cleaning."""
        # Preserve special patterns
        preserved = {}
        for name, pattern in self.special_patterns.items():
            matches = pattern.finditer(text)
            for i, match in enumerate(matches):
                key = f"__PRESERVED_{name}_{i}__"
                preserved[key] = match.group()
                text = text.replace(match.group(), key)

        # Basic cleaning
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()

        # Restore preserved patterns
        for key, value in preserved.items():
            text = text.replace(key, value)

        return text

    def _update_search_indices(self, chunk_data: List[ChunkMetadata]):
        """Update both BM25 and FAISS indices."""
        try:
            # Process new texts for BM25
            new_tokenized_texts = [
                chunk.processed_text.split() 
                for chunk in chunk_data
            ]
            
            # Add to our stored tokenized texts
            self.tokenized_texts.extend(new_tokenized_texts)
            
            # Reinitialize BM25 with all texts
            if len(self.tokenized_texts) > 0:
                self.bm25 = BM25Okapi(self.tokenized_texts)
            
            # Update FAISS
            embeddings = np.vstack([
                self._get_embedding(chunk.processed_text)
                for chunk in chunk_data
            ])
            faiss.normalize_L2(embeddings)
            self.index.add(embeddings)
            
            logger.info(
                f"Updated indices - BM25 corpus size: {len(self.tokenized_texts)}, "
                f"FAISS size: {self.index.ntotal}"
            )
            
        except Exception as e:
            logger.error(f"Error updating search indices: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def clear_indices(self):
        """Clear all indices and stored data."""
        try:
            # Clear FAISS index
            self.index = faiss.IndexFlatIP(self.embedding_dim)
            
            # Clear BM25 data
            self.tokenized_texts = []
            self.bm25 = None
            
            # Clear metadata
            self.chunks_metadata = []
            
            logger.info("All indices cleared successfully")
        except Exception as e:
            logger.error(f"Error clearing indices: {e}")
            raise

    async def search(
        self,
        query: str,
        top_k: int = 5,
        semantic_weight: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search combining BM25 and semantic search with smart scoring.
        """
        try:
        # Validate top_k
            if top_k <= 0:
                raise ValueError("top_k must be greater than 0.")

        # Check if chunks_metadata is empty
            if not self.chunks_metadata:
                logger.warning("Chunks metadata is empty. No data to search.")
                return []  # Return empty result instead of raising an error
            # Clean query
            cleaned_query = await self._clean_text(query)
            print("cleaned", cleaned_query)
            
            # Check if BM25 is initialized
            if self.bm25 is None:
                logger.warning("BM25 index not initialized. Using only semantic search.")
                bm25_scores = np.zeros(len(self.chunks_metadata))
            else:
                # Get BM25 scores
                bm25_scores = self.bm25.get_scores(cleaned_query.split())
            
            # Get semantic scores
            query_embedding = self._get_embedding(cleaned_query)
            query_embedding = query_embedding.reshape(1, -1)
            faiss.normalize_L2(query_embedding)
            k = min(len(self.chunks_metadata), top_k * 2)
            if k <= 0:
                raise ValueError("Invalid value of k. Ensure chunks_metadata is not empty.")

            semantic_distances, semantic_indices = self.index.search(query_embedding, k)
            
            # Combine scores
            combined_scores = []
            for idx, (bm25_score, (semantic_idx, semantic_score)) in enumerate(
                zip(bm25_scores, zip(semantic_indices[0], semantic_distances[0]))
            ):
                if semantic_idx < 0:  # FAISS returns -1 for not enough results
                    continue
                    
                # Normalize scores
                norm_bm25 = bm25_score / max(bm25_scores) if max(bm25_scores) > 0 else 0
                norm_semantic = (semantic_score + 1) / 2  # Convert from [-1,1] to [0,1]
                # Calculate boost for special matches
                boost = self._calculate_boost(cleaned_query, self.chunks_metadata[idx])
                # Combine scores with weights
                final_score = (
                    semantic_weight * norm_semantic +
                    (1 - semantic_weight) * norm_bm25
                ) * boost
                
                combined_scores.append((idx, final_score))
            
            # Sort by score and get top_k
            combined_scores.sort(key=lambda x: x[1], reverse=True)
            top_results = combined_scores[:top_k]
            
            # Format results
            results = []
            for idx, score in top_results:
                chunk = self.chunks_metadata[idx]
                results.append({
                    "doc_id": chunk.doc_id,
                    "chunk_id": chunk.chunk_id,
                    "text": chunk.original_text,
                    "score": float(score),
                    "special_matches": chunk.special_matches
                })
            
            return results
            
        except Exception as e:
            # Log the full traceback
            logger.error("Error during search:\n" + traceback.format_exc())
            raise  # Optionally re-raise the exception to propagate it


    def _calculate_boost(self, query: str, chunk: ChunkMetadata) -> float:
        """Calculate boost factor based on special matches."""
        boost = 1.0
        
        # Boost for article/section matches
        if (chunk.special_matches.get("article_ref") and 
            any(ref in query for ref in chunk.special_matches["article_ref"])):
            boost *= 1.5
            
        # Boost for legal reference matches
        if chunk.special_matches.get("legal_refs"):
            boost *= 1.2
            
        # Boost for definition matches
        if chunk.special_matches.get("definitions"):
            boost *= 1.1
            
        return boost

    def _generate_doc_metadata(self, chunk_data: List[ChunkMetadata]) -> Dict[str, Any]:
        """Generate document metadata and statistics."""
        return {
            "num_chunks": len(chunk_data),
            "avg_chunk_length": np.mean([
                len(chunk.original_text.split()) 
                for chunk in chunk_data
            ]),
            "special_patterns": {
                pattern: sum(
                    len(chunk.special_matches.get(pattern, []))
                    for chunk in chunk_data
                )
                for pattern in self.special_patterns
            }
        }

    async def save_state(self, path: str):
        """Save index state to disk."""
        if not self.cache_dir:
            return
        
        save_path = Path(path)
        faiss.write_index(self.index, str(save_path / "faiss.index"))
        
        # Save metadata and BM25 state...
        # (implementation details omitted for brevity)

    async def load_state(self, path: str):
        """Load index state from disk."""
        if not self.cache_dir:
            return
        
        load_path = Path(path)
        self.index = faiss.read_index(str(load_path / "faiss.index"))
        
        # Load metadata and BM25 state...
        # (implementation details omitted for brevity)