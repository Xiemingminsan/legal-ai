# amharic_rag.py

import logging
from dataclasses import dataclass
import math
from typing import Dict, List, Optional, Tuple
import numpy as np
import requests
import faiss
import pytesseract
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io

logger = logging.getLogger(__name__)

@dataclass
class AmharicChunk:
    """Represents a chunk of Amharic text with its processed form."""
    doc_id: str
    chunk_id: int
    raw_text: str           # Original Amharic text
    processed_text: str     # Stemmed/normalized Amharic text
    embedding_idx: int      # Index in FAISS

class AmharicRAG:
    def __init__(
        self,
        embedding_model_name: str = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
        gemini_api_key: Optional[str] = None,
        max_chunk_chars: Optional[int] = 5000,
        stemmer_api_url: Optional[str] = None,
    ):
        # Embedding model setup
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        
        # Stemmer API URL configuration
        self.stemmer_api_url = stemmer_api_url or os.getenv("STEMMER_API_URL", "http://localhost:5000/api/stemmer/stem")
        
        # Max chunk size for splitting text
        self.max_chunk_chars = max_chunk_chars
        
        # Chunks storage
        self.chunks = []  # Initialize as an empty list to store chunks
        
        # BM25 setup
        self.tokenized_texts = ["placeholder"]  # For storing tokenized texts for BM25
        self.bm25 = BM25Okapi(self.tokenized_texts)
        
        # LLM setup (if provided)
        if gemini_api_key:
            self.llm = "ok"
        else:
            self.llm = None
            
    def _ocr_pdf_with_fitz(self, pdf_path: str) -> str:
        """
        Extract Amharic text from a PDF using PyMuPDF for text extraction and Tesseract for OCR.
        """
        extracted_text = []

        try:
            pdf_document = fitz.open(pdf_path)

            for page_number in range(len(pdf_document)):
                page = pdf_document[page_number]

                # Step 1: Direct text extraction
                text = page.get_text("text")
                if text.strip():
                    extracted_text.append(text)
                else:
                    # Step 2: OCR on images
                    pix = page.get_pixmap()
                    image = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_text = pytesseract.image_to_string(image, lang="amh")
                    if ocr_text.strip():
                        extracted_text.append(ocr_text)

            pdf_document.close()

        except Exception as e:
            logger.error(f"Error processing PDF: {e}")

        return "\n".join(extracted_text)

    def _chunk_text(self, text: str) -> List[str]:
        """Split Amharic text into chunks using sentence boundaries."""
        # Split on Amharic full stop (።) and other logical breaks
        sentences = text.split('።')
        chunks = []
        current_chunk = []
        current_len = 0
        max_chunk_chars = 50
        
        for sent in sentences:
            sent = sent.strip()
            if not sent:
                continue
                
            sent_len = len(sent)
            if current_len + sent_len > max_chunk_chars and current_chunk:
                chunks.append('።'.join(current_chunk) + '።')
                current_chunk = []
                current_len = 0
            
            current_chunk.append(sent)
            current_len += sent_len
            
        if current_chunk:
            chunks.append('።'.join(current_chunk) + '።')
            
        return chunks

    def _update_indices(self, chunks: List[AmharicChunk]):
        """Update both BM25 and FAISS indices with new chunks."""
        # Update BM25 with processed (stemmed) Amharic text
        new_tokenized = [c.processed_text.split() for c in chunks]
        self.tokenized_texts.extend(new_tokenized)
        self.bm25 = BM25Okapi(self.tokenized_texts)
        
        # Update FAISS with embeddings of processed Amharic text
        embeddings = []
        for chunk in chunks:
            # Embed the processed Amharic text directly
            emb = self.embedding_model.encode(chunk.processed_text)
            embeddings.append(emb)
            
        embeddings = np.vstack(embeddings)
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        
        # Store chunks
        self.chunks.extend(chunks)

    def stem_text(self, text: str) -> str:
        """
        Directly call the stemmer API to stem the given text.
        """
        try:
            response = requests.post(self.stemmer_api_url, json={"text": text})
            response.raise_for_status()
            data = response.json()
            stemmed_text = data.get("stemmedText", "")
            return stemmed_text if stemmed_text else text
        except requests.exceptions.RequestException as e:
            logger.error(f"Error communicating with the stemmer API: {e}")
            return text  # Fallback: return original text

    def process_document(self, pdf_path: str, doc_id: str) -> Dict:
        """Process an Amharic PDF document."""
        try:
            # Validate the provided PDF path
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"The file at path '{pdf_path}' does not exist.")
            
            # 1. Extract text
            logger.info(f"Extracting text from PDF: {pdf_path}")
            amharic_text = self._ocr_pdf_with_fitz(pdf_path)
            if not amharic_text.strip():
                raise ValueError("No text extracted from the provided PDF.")
            
            # 2. Chunk the text
            logger.info("Chunking extracted text...")
            raw_chunks = self._chunk_text(amharic_text)
            
            # 3. Process chunks and create AmharicChunk objects
            processed_chunks = []
            start_idx = len(self.chunks)
            
            for i, raw_chunk in enumerate(raw_chunks):
                # Use stemmer to process text
                processed_text = self.stem_text(raw_chunk)
                print(processed_text)
                
                chunk = AmharicChunk(
                    doc_id=doc_id,
                    chunk_id=i,
                    raw_text=raw_chunk,
                    processed_text=processed_text,
                    embedding_idx=start_idx + i
                )
                processed_chunks.append(chunk)
            
            # 4. Update indices
            logger.info("Updating indices with new chunks...")
            self._update_indices(processed_chunks)
            
            return {
                "status": "success",
                "doc_id": doc_id,
                "num_chunks": len(processed_chunks),
                "chunks": [chunk.raw_text for chunk in processed_chunks]
            }

        except Exception as e:
            logger.error(f"Error processing document: {e}")
            raise

    async def search_and_answer(
        self,
        query: str,
        top_k: int = 1,
        semantic_weight: float = 0.5
    ) -> Dict:
        try:
            processed_query = self.stem_text(query)
            print(processed_query)
            
            relevant_chunks, scores = self._hybrid_search(
                processed_query,
                top_k,
                semantic_weight
            )

            print("relevant chunk", relevant_chunks)
            
            return {
                "status": "success",
                "query": query,
                "total_chunks": len(self.chunks),
                "results": [
                    {
                        "text": chunk,
                        "similarity": float(score)  # Convert numpy float to Python float
                    }
                    for chunk, score in zip(relevant_chunks, scores)
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in search and answer: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    def _hybrid_search(
        self,
        processed_query: str,
        top_k: int,
        semantic_weight: float
    ) -> Tuple[List[str], List[float]]:
        """Combine BM25 and semantic search on processed Amharic text."""
        if not self.chunks:
            return [], []
            
        # BM25 on processed text
        query_terms = processed_query.split()
        bm25_scores = self.bm25.get_scores(query_terms)
        max_bm25 = max(bm25_scores) if len(bm25_scores) > 0 else 1.0

        # Semantic search on processed query
        query_emb = self.embedding_model.encode([processed_query])
        faiss.normalize_L2(query_emb)
        distances, indices = self.index.search(query_emb, len(self.chunks))

        # Combine scores
        combined_scores = []
        exact_match_boost = 0.3  # Adjust this value to control exact match importance

        for i in range(len(self.chunks)):
            # Calculate semantic score
            semantic_score = 0
            idx_matches = np.where(indices[0] == i)[0]
            if len(idx_matches) > 0:
                semantic_score = float(distances[0][idx_matches[0]])
            
            # Calculate BM25 score
            bm25_score = float(bm25_scores[i]) / max_bm25

            # Handle potential NaN or infinite values
            if math.isnan(semantic_score) or math.isinf(semantic_score):
                semantic_score = 0
            if math.isnan(bm25_score) or math.isinf(bm25_score):
                bm25_score = 0

            # Calculate exact match boost
            exact_match_score = 0
            # Convert chunk to string before splitting and lowering
            chunk_terms = str(self.chunks[i]).lower().split()
            
            # Count exact matches for each query term
            for term in query_terms:
                if term.lower() in chunk_terms:
                    exact_match_score += 1
            
            # Normalize exact match score by query length and apply boost
            if len(query_terms) > 0:
                exact_match_score = (exact_match_score / len(query_terms)) * exact_match_boost

            # Combine all scores
            final_score = (semantic_weight * semantic_score) + \
                        ((1 - semantic_weight) * bm25_score) + \
                        exact_match_score

            combined_scores.append((i, final_score))

        # Sort and retrieve top_k
        combined_scores.sort(key=lambda x: x[1], reverse=True)
        top_chunks = [self.chunks[idx] for idx, _ in combined_scores[:top_k]]
        top_scores = [score for _, score in combined_scores[:top_k]]

        return top_chunks, top_scores

    # async def _translate_for_llm

    # async def _get_llm_response


    # async def _translate_to_amharic
