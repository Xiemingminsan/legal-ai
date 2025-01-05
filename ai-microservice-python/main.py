import os
import uvicorn
import faiss
import numpy as np
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer
from typing import List, Dict
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model and index
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
dimension = 384
faiss_index = faiss.IndexFlatIP(dimension)
documents_store = []

# Constants
CHUNK_SIZE = 200
BATCH_SIZE = 10  # Number of chunks to embed at once

class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        try:
            text = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    if page_text := page.extract_text():
                        text += page_text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

    @staticmethod
    def chunk_text(text: str) -> List[str]:
        """Smart text chunking with overlap"""
        words = text.split()
        chunks = []
        overlap = 50  # Words of overlap between chunks
        
        for i in range(0, len(words), CHUNK_SIZE - overlap):
            chunk = words[i:i + CHUNK_SIZE]
            if chunk:
                chunks.append(" ".join(chunk))
        return chunks

    @staticmethod
    def batch_embed(chunks: List[str]) -> np.ndarray:
        """Embed chunks in batches to manage memory"""
        all_embeddings = []
        
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i:i + BATCH_SIZE]
            embeddings = embedding_model.encode(batch, convert_to_numpy=True)
            faiss.normalize_L2(embeddings)
            all_embeddings.append(embeddings)
            
        return np.vstack(all_embeddings)

@app.post("/embed_document")
async def embed_document(doc_id: str = Form(...), pdf_path: str = Form(...)):
    try:
        logger.info(f"Processing document {doc_id}")
        
        # Validate PDF path
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=400, detail="PDF file not found")
            
        # Extract text
        raw_text = DocumentProcessor.extract_text_from_pdf(pdf_path)
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="No text extracted from PDF")
            
        # Process chunks
        chunks = DocumentProcessor.chunk_text(raw_text)
        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks generated")
            
        # Generate embeddings
        embeddings = DocumentProcessor.batch_embed(chunks)
        
        # Update FAISS index
        faiss_index.add(embeddings)
        
        # Store metadata
        start_idx = len(documents_store)
        for chunk in chunks:
            documents_store.append({
                "doc_id": doc_id,
                "text": chunk,
                "index": start_idx + len(documents_store)
            })
        
        return {
            "status": "success",
            "chunks_added": len(chunks),
            "total_chunks": len(documents_store)
        }
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_similar_chunks(query: str = Form(...), top_k: int = Form(3)):
    try:
        if not documents_store:
            return {"results": []}
            
        query_embedding = embedding_model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)
        
        distances, indices = faiss_index.search(query_embedding, min(top_k, len(documents_store)))
        
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx != -1:  # Valid index
                metadata = documents_store[idx]
                results.append({
                    "doc_id": metadata["doc_id"],
                    "text": metadata["text"],
                    "similarity": float(dist)
                })
                
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)