import datetime
import json
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
from typing import Any, List, Dict
from pathlib import Path
import logging
import requests  # To call Mistral's API
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "http://localhost:8000"],  # Corrected CORS origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FAISS_INDEX_PATH = "faiss_index_file.index"
DOCUMENTS_STORE_PATH = "documents_store.json"
# Initialize model and index
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
dimension = 384
faiss_index = faiss.IndexFlatIP(dimension)
documents_store = []

# Constants
CHUNK_SIZE = 200
BATCH_SIZE = 10  # Number of chunks to embed at once
load_dotenv(dotenv_path="../backend-node/.env")

# AI configuration
USE_LOCAL_LLM = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"
MISTRAL_API_URL = os.getenv("MISTRAL_API_URL")  # e.g., "https://api.mistral.ai/v1/chat/completions"
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")  # if needed
print("MISTRAL_API_URL",MISTRAL_API_URL)
if USE_LOCAL_LLM:
    logger.info("Using local LLM")
    # Load local Mistral LLM
    MISTRAL_MODELS_PATH = Path.home().joinpath('mistral_models', '7B-Instruct-v0.3')
    tokenizer = AutoTokenizer.from_pretrained(MISTRAL_MODELS_PATH)
    model = AutoModelForCausalLM.from_pretrained(
        "mistralai/Mistral-7B-Instruct-v0.3",
        trust_remote_code=True,
        device_map="auto",
        torch_dtype=torch.bfloat16
    )
else:
    logger.info("Using online LLM via Mistral API")

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

# Modified initialization code
def initialize_faiss():
    global faiss_index, documents_store
    
    # Initialize with default values
    dimension = 384
    faiss_index = None
    documents_store = []
    
    try:
        # Try to load existing index
        if os.path.exists(FAISS_INDEX_PATH):
            faiss_index = faiss.read_index(FAISS_INDEX_PATH)
            logger.info("Loaded existing FAISS index")
        else:
            faiss_index = faiss.IndexFlatIP(dimension)
            logger.info("Created new FAISS index")
            
        # Try to load existing documents store
        if os.path.exists(DOCUMENTS_STORE_PATH):
            with open(DOCUMENTS_STORE_PATH, 'r', encoding='utf-8') as f:
                documents_store = json.load(f)
            logger.info("Loaded existing documents store")
        else:
            documents_store = []
            logger.info("Created new documents store")
            
    except Exception as e:
        logger.error(f"Error initializing FAISS: {e}")
        faiss_index = faiss.IndexFlatIP(dimension)
        documents_store = []
    
    return faiss_index, documents_store

# Function to save the current state
def save_faiss_state():
    try:
        # Save FAISS index
        faiss.write_index(faiss_index, FAISS_INDEX_PATH)
        
        # Save documents store
        with open(DOCUMENTS_STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(documents_store, f, ensure_ascii=False, indent=2)
            
        logger.info("FAISS state saved successfully")
    except Exception as e:
        logger.error(f"Error saving FAISS state: {e}")

@app.post("/embed_document")
async def embed_document(doc_id: str = Form(...), pdf_path: str = Form(...)):
    try:
        print(f"Processing document {doc_id}")
        print(f"PDF path: {pdf_path}")
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
        current_time = datetime.datetime.utcnow().isoformat()
        
        # Get filename from path to use as title if needed
        filename = os.path.basename(pdf_path)
        
        for chunk in chunks:
            documents_store.append({
                "doc_id": doc_id,
                "title": filename,
                "text": chunk,
                "index": start_idx + len(documents_store),
                "uploadDate": current_time,
                "status": "completed"
            })

        save_faiss_state() 
        return {
            "status": "success",
            "chunks_added": len(chunks),
            "total_chunks": len(documents_store)
        }
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{doc_id}/status")
async def get_document_status(doc_id: str):
    try:
        # Find all chunks for this document
        doc_chunks = [doc for doc in documents_store if doc["doc_id"] == doc_id]
        
        if not doc_chunks:
            return {
                "status": "not_found",
                "progress": 0
            }
            
        # Return the status of the document
        return {
            "status": doc_chunks[0].get("status", "processing"),
            "progress": 100 if doc_chunks[0].get("status") == "completed" else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting document status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/search")
async def search_similar_chunks(query: str = Form(...), top_k: int = Form(3)):
    try:
        if not documents_store:
            print("documents_store", documents_store)
            return {"results": []}
        
        # Ensure FAISS index is loaded
        try:
            faiss_index = faiss.read_index("faiss_index_file.index")
        except Exception as e:
            logger.error(f"FAISS index loading error: {e}")
            return {"results": []}

        # 1. Semantic Search
        query_embedding = embedding_model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)
        distances, indices = faiss_index.search(query_embedding, len(documents_store))  # Get all results initially
        
        # 2. Keyword matching
        query_terms = set(query.lower().split())
        
        # 3. Combine results with hybrid scoring
        hybrid_results = []
        for idx, semantic_score in zip(indices[0], distances[0]):
            if idx != -1:  # Valid index
                doc = documents_store[idx]
                text = doc["text"].lower()
                
                # Calculate exact match score
                exact_match_score = 0
                for term in query_terms:
                    if term in text:
                        exact_match_score += 1
                
                # Normalize exact match score
                exact_match_score = exact_match_score / len(query_terms)
                
                # Calculate final score (weighted combination)
                # Adjust these weights to balance semantic vs exact matching
                semantic_weight = 0.6
                exact_weight = 0.4
                final_score = (semantic_weight * float(semantic_score)) + (exact_weight * exact_match_score)
                
                # Boost score significantly if the exact query appears in the text
                if query.lower() in text:
                    final_score *= 1.5
                
                hybrid_results.append({
                    "doc_id": doc["doc_id"],
                    "text": doc["text"],
                    "similarity": final_score,
                    "semantic_score": float(semantic_score),
                    "exact_match_score": exact_match_score
                })
        
        # Sort by final score and take top_k results
        hybrid_results.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = hybrid_results[:top_k]
        
        return {"results": top_results}
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qa")
async def rag_qa(query: str = Form(...), top_k: int = Form(3)):
    try:
        # Previous code remains the same until the API response handling...
        retrieval_res = await search_similar_chunks(query, top_k)
        chunks = retrieval_res.get("results", [])

        if not chunks:
            return {
                "answer": "No documents in the index yet.",
                "chunksUsed": []
            }

        # 2) Build context string
        context_texts = []
        for c in chunks:
            context_texts.append(f"Chunk from doc {c['doc_id']}:\n{c['text']}\n")

        context_str = "\n\n".join(context_texts)

        # 3) Generate the prompt
        prompt = (
            f"You are a helpful assistant. Here is the relevant context:\n\n"
            f"{context_str}\n\n"
            f"User question: {query}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. If the question is a general greeting or about your capabilities, respond naturally and conversationally. Never reference the context.\n"
            f"2. For all other questions:\n"
            f"   - ONLY use the information explicitly stated in the provided context.\n"
            f"   - If the context does not provide sufficient information to answer the question, respond with: \"Based on the provided context, I cannot answer this question.\"\n"
            f"   - Do not include any external knowledge or assumptions.\n"
            f"   - Keep answers concise and factual.\n"
            f"   - If you quote from the context, use exact quotes.\n\n"
            f"Answer:"
        )

        # 4) Call Mistral API
        if not MISTRAL_API_URL:
            raise HTTPException(status_code=500, detail="Mistral API URL not configured.")

        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}" if MISTRAL_API_KEY else "",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistral-7b-instruct-v0.3",
            "inputs": prompt,
            "max_tokens": 300,
            "temperature": 0.2,
            "stop": None
        }

        try:
            response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)

            if response.status_code != 200:
                logger.error(f"Mistral API error: {response.text}")
                return {"answer": "Error communicating with AI service.", "chunksUsed": chunks}

            ai_output = response.json()

            # Extract the generated text
            if isinstance(ai_output, list) and len(ai_output) > 0:
                full_text = ai_output[0].get('generated_text', '')
            else:
                full_text = ai_output.get('choices', [{}])[0].get('text', '')

            # Extract just the answer part
            answer_text = ""
            if full_text:
                # Split by the last occurrence of "Answer:" since it might appear in the context
                parts = full_text.split("Answer:", 1)
                if len(parts) > 1:
                    answer_text = parts[1].strip()
                else:
                    # If no "Answer:" found, try to extract the actual answer part
                    # Look for the response after all the instructions
                    instruction_markers = [
                        "INSTRUCTIONS:",
                        "- If you quote from the context",
                        "- Keep answers concise and factual"
                    ]
                    for marker in instruction_markers:
                        parts = full_text.split(marker)
                        if len(parts) > 1:
                            full_text = parts[-1].strip()
                    answer_text = full_text

                # Clean up any remaining prompt/instruction text
                answer_text = answer_text.strip()
            else:
                answer_text = "Based on the provided context, I cannot answer this question."

            return {
                "answer": answer_text,
                "chunksUsed": chunks
            }

        except Exception as e:
            logger.error(f"Online LLM error: {e}")
            return {"answer": "Error communicating with AI service.", "chunksUsed": chunks}

    except Exception as e:
        logger.error(f"QA error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/faiss/index")
async def get_faiss_index():
    try:
        global faiss_index
        if faiss_index is None:
            raise HTTPException(status_code=404, detail="FAISS index not found")

        index_info = {
            "dimension": faiss_index.d,
            "number_of_vectors": faiss_index.ntotal,
            "metric": faiss_index.metric_type,  # e.g., faiss.METRIC_L2
            # Add more details as needed
        }

        return {"faiss_index": index_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/faiss/documents")
async def list_faiss_documents() -> Dict[str, List[Dict[str, Any]]]:
    try:
        documents = []
        # Assuming faiss_index and documents_store are properly initialized
        for idx in range(faiss_index.ntotal):
            doc_metadata = documents_store[idx]
            
            # Create document entry without embedding by default
            document = {
                "index": idx,
                "doc_id": doc_metadata["doc_id"],
                "title": doc_metadata["title"],
                "uploadDate": doc_metadata["uploadDate"],
                "text": doc_metadata["text"]
            }
            documents.append(document)
            
        return {"documents": documents}
        
    except KeyError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required metadata field: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.delete("/faiss/clear")
async def clear_faiss_index():
    global faiss_index, documents_store
    try:
        # Reset the FAISS index
        dimension = faiss_index.d
        faiss_index = faiss.IndexFlatIP(dimension)
        
        # Clear the document store
        documents_store.clear()
        
        # Save the cleared state
        save_faiss_state()

        return {
            "status": "success",
            "message": "FAISS index and documents cleared"
        }
    except Exception as e:
        logger.error(f"Error clearing FAISS index: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.on_event("startup")
async def startup_event():
    global faiss_index, documents_store
    faiss_index, documents_store = initialize_faiss()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Legal AI Microservice!"}

if __name__ == "__main__":
    # # Load FAISS index and documents_store from disk if exists
    # INDEX_PATH = Path('faiss_index/index.faiss')
    # METADATA_PATH = Path('faiss_index/documents_store.json')

    # if INDEX_PATH.exists() and METADATA_PATH.exists():
    #     faiss_index = faiss.read_index(str(INDEX_PATH))
    #     with open(METADATA_PATH, 'r') as f:
    #         documents_store = json.load(f)
    #     logger.info("FAISS index and documents_store loaded from disk.")
    # else:
    #     faiss_index = faiss.IndexFlatIP(dimension)
    #     documents_store = []
    #     logger.info("Initialized new FAISS index and documents_store.")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
