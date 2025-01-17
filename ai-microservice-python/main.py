# main.py
import datetime
import os
import json
import logging
from pathlib import Path
from typing import Any, List, Dict, Optional

import faiss
import numpy as np
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from nltk.tokenize import word_tokenize
from dotenv import load_dotenv

from utils.pdf_extractor import PDFExtractor
from utils.rag_processor import RAGProcessor
from utils.query_preprocessor import QueryPreprocessor
from gemini_helper import call_gemini_api
from summary import summarize_with_gemini

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants and file paths
CACHE_DIR = Path("./cache")
DOCUMENTS_STORE_PATH = CACHE_DIR / "documents_store.json"
FAISS_INDEX_PATH = CACHE_DIR / "faiss_index_file.index"
DIMENSION = 384  # for "all-MiniLM-L6-v2"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

class GlobalState:
    """Singleton class to manage global state"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.initialize()
        return cls._instance
    
    def initialize(self):
        """Initialize or load the FAISS index and documents store"""
        self.documents_store = []
        
        # Load documents store
        if DOCUMENTS_STORE_PATH.exists():
            try:
                with open(DOCUMENTS_STORE_PATH, 'r', encoding='utf-8') as f:
                    self.documents_store = json.load(f)
                logger.info("Loaded existing documents store")
            except Exception as e:
                logger.error(f"Failed to load documents store: {e}")
        
        # Initialize or load FAISS index
        try:
            if FAISS_INDEX_PATH.exists():
                self.faiss_index = faiss.read_index(str(FAISS_INDEX_PATH))
                logger.info("Loaded existing FAISS index")
            else:
                self.faiss_index = faiss.IndexFlatIP(DIMENSION)
                logger.info("Created new FAISS index")
        except Exception as e:
            logger.error(f"Error initializing FAISS index: {e}")
            self.faiss_index = faiss.IndexFlatIP(DIMENSION)
        
        # Initialize RAG processor with the existing FAISS index
        self.rag_processor = RAGProcessor(
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
            batch_size=32,
            cache_dir=str(CACHE_DIR),
            faiss_index=self.faiss_index
        )
    
    async def save_state(self):
        """Save the current state to disk"""
        try:
            # Save FAISS index
            faiss.write_index(self.faiss_index, str(FAISS_INDEX_PATH))
            
            # Save documents store
            with open(DOCUMENTS_STORE_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.documents_store, f, ensure_ascii=False, indent=2)
            
            logger.info("System state saved successfully")
        except Exception as e:
            logger.error(f"Error saving system state: {e}")
            raise
    
    def clear_state(self):
        """Clear the current state"""
        self.faiss_index = faiss.IndexFlatIP(DIMENSION)
        self.documents_store.clear()
        self.rag_processor.update_index(self.faiss_index)

# Initialize FastAPI
app = FastAPI()
global_state = GlobalState()

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/faiss/index")
async def get_faiss_index_info():
    index = global_state.faiss_index
    return {
        "faiss_index": {
            "dimension": index.d,
            "number_of_vectors": index.ntotal,
            "metric": index.metric_type
        }
    }

@app.get("/faiss/documents")
async def list_faiss_documents():
    try:
        return {"documents": global_state.documents_store}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/faiss/clear")
async def clear_faiss_index():
    try:
        global_state.clear_state()
        await global_state.save_state()
        return {"status": "success", "message": "FAISS index and documents cleared"}
    except Exception as e:
        logger.error(f"Error clearing FAISS index: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize system state on startup."""
    logger.info("Application starting up with initialized global state")

@app.on_event("shutdown")
async def shutdown_event():
    """Save state on shutdown."""
    await global_state.save_state()

@app.post("/embed_document")
async def embed_document(
    doc_id: str = Form(...),
    pdf_path: str = Form(...),
    doc_scope: str = Form(...),
    category: str = Form(...)
) -> Dict[str, Any]:
    """
    Process and embed a document using the new RAG system.
    
    Args:
        doc_id: Unique document identifier
        pdf_path: Path to the PDF file
        doc_scope: Document scope/domain
        category: Document category
    """
    try:
        logger.info(f"Processing doc_id={doc_id}, pdf_path={pdf_path}")

        # 1. Extract text from PDF
        text = PDFExtractor.extract_text_from_pdf(pdf_path)
        if not text:
            raise HTTPException(
                status_code=400,
                detail="No text extracted from PDF"
            )

        # 2. Process document with new RAG system
        result = await global_state.rag_processor.process_document(doc_id, text)
        
        # 3. Store document metadata
        current_time = datetime.datetime.utcnow().isoformat()
        filename = os.path.basename(pdf_path)
        
        # Add entries to documents store
        chunks = result["chunk_data"]  # Use the correct key that holds chunk info
        print(f"Number of chunks: {len(chunks)}")
        for i, chunk in enumerate(chunks):
            print(f"Chunk {i}: {chunk}")
            global_state.documents_store.append({
                "doc_id": doc_id,
                "title": filename,
                "text": chunk.original_text,
                "index": len(global_state.documents_store),
                "uploadDate": current_time,
                "docScope": doc_scope,
                "category": category,
                "status": "completed",
            })

        await global_state.save_state()

        return {
            "status": "success",
            "doc_id": doc_id,
            "chunks_added": result["num_chunks"],
            "stats": result["metadata"]
        }

    except Exception as e:
        logger.error(f"Error embedding document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{doc_id}/status")
async def get_document_status(doc_id: str):
    try:
        doc_chunks = [doc for doc in global_state.documents_store if doc["doc_id"] == doc_id]
        if not doc_chunks:
            return {"status": "not_found", "progress": 0}

        # Assume the first chunk's status is representative
        status = doc_chunks[0].get("status", "processing")
        progress = 100 if status == "completed" else 0
        return {"status": status, "progress": progress}

    except Exception as e:
        logger.error(f"Error getting document status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_similar_chunks(
    query: str = Form(...),
    top_k: int = Form(3),
    semantic_weight: float = Form(0.7)
) -> Dict[str, Any]:
    """
    Hybrid search endpoint using the new RAG system.
    
    Args:
        query: Search query text
        top_k: Number of results to return
        semantic_weight: Weight for semantic search vs lexical search (0-1)
    """
    try:
        if not global_state.documents_store or global_state.rag_processor.index.ntotal == 0:
            return {"results": []}
        
        # Perform hybrid search
        raw_results = await global_state.rag_processor.search(
            query=query,
            top_k=top_k,
            semantic_weight=semantic_weight
        )

        # Format results with document metadata
        formatted_results = []
        for result in raw_results:
            # Find corresponding document store entry
            doc_entry = next(
                (doc for doc in global_state.documents_store 
                 if doc["doc_id"] == result["doc_id"] and 
                 doc["text"] == result["text"]),
                None
            )
            
            if doc_entry:
                formatted_results.append({
                    "doc_id": result["doc_id"],
                    "text": result["text"],
                    "similarity": result["score"],
                    "title": doc_entry.get("title", ""),
                    "docScope": doc_entry.get("docScope", ""),
                    "category": doc_entry.get("category", ""),
                    "uploadDate": doc_entry.get("uploadDate", ""),
                    "special_matches": result["special_matches"]
                })

        return {
            "results": formatted_results,
            "query_processed": query
        }

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qa")
async def rag_qa(query: str = Form(...), context: str = Form(...), top_k: int = Form(3)):
    try:
        semantic_weight=0.7
        retrieval_res = await search_similar_chunks(query, top_k,semantic_weight)
        
        chunks = retrieval_res.get("results", [])
        if not chunks:
            return {"answer": "No documents found or no index built.", "chunksUsed": []}

        context_texts = [context] + [f"Chunk from doc {c['doc_id']}:\n{c['text']}" for c in chunks]
        context_str = "\n\n".join(context_texts)

        payload = {
    "contents": [{
        "parts": [
            {
                "text": (
                    f"You are a highly contextual assistant designed to answer questions based on provided information only. "
                    f"Follow these rules when answering user queries:\n\n"

                    f"1. Always prioritize context in the following order:\n"
                    f"   - Relevant chunks retrieved from the database or knowledge base.\n"
                    f"   - The last 7 messages for conversational relevance.\n"
                    f"   - The conversation summary for broader context.\n\n"

                    f"2. For follow-up questions:\n"
                    f"   - Check the last 7 messages and chunks to identify what the user is referring to.\n"
                    f"   - If no clarity is found in the last 5 messages, check the conversation summary.\n\n"

                    f"3. NEVER answer based solely on your own knowledge. Only use the context provided in chunks, messages, or summary.\n\n"

                    f"4. If the context is insufficient:\n"
                    f"   - Ask the user to clarify or rephrase their query politely.\n\n"

                    f"5. Your responses must be:\n"
                    f"   - Concise and factual.\n"
                    f"   - Based explicitly on the context provided.\n"
                    f"   - Polite and professional.\n\n"

                    f"EXAMPLES:\n"
                    f"- If the query is ambiguous:\n"
                    f"  * User: 'What was I asking about?'\n"
                    f"  * Response: 'Based on our conversations, you were discussing [topic]. Can you clarify further?'\n\n"

                    f"- If the query requires more detail:\n"
                    f"  * User: 'Explain More.'\n"
                    f"  * Response: 'Based on our conversation, Article 637 discusses [key points from the context]. Let me know if you'd like a more detailed explanation.'\n\n"

                    f"- If the query is outside the provided context:\n"
                    f"  * User: 'Tell me about physics.'\n"
                    f"  * Response: 'Based on the provided context, I cannot answer this question. Can you provide more details or rephrase?'\n\n"

                    f"Begin by answering the following query:\n\n"
                    f"Here is the relevant context:\n\n{context_str}\n\n"
                    f"User question: {query}\n\n"
                    f"Answer:"
                )
            }
        ]
    }]
}
        result, error = call_gemini_api(payload)
        if error:
            logger.error(f"Gemini error: {error}")
            return {"answer": error, "chunksUsed": chunks}

        return {
            "answer": result["answer"],
            "chunksUsed": chunks,
            "geminiMetadata": result.get("geminiMetadata", {})
        }

    except Exception as e:
        logger.error(f"QA error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize(conversationText: str = Form(...)):
    try:
        summary = summarize_with_gemini(conversationText)
        if not summary:
            raise HTTPException(status_code=500, detail="Failed to summarize the conversation.")
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize_doc")
def summarize_doc(doc_params: Dict[str, Any]):
    doc_id = doc_params.get("docId")
    mode = doc_params.get("mode", "summary")

    relevant_chunks = [d for d in global_state.documents_store if d["doc_id"] == doc_id]
    if not relevant_chunks:
        return {"error": "No chunks found for this documentId."}

    combined_text = "\n".join(rc["text"] for rc in relevant_chunks)
    if mode == "summary":
        prompt = f"Summarize the following text:\n\n{combined_text}\n\nSummary:"
    else:
        prompt = f"Extract key points from this text in bullet form:\n\n{combined_text}\n\nKey Points:"

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }
    result, error = call_gemini_api(payload)
    if error:
        return {"error": error}
    return {"summary": result["answer"]}

@app.post("/classify_doc")
def classify_doc(doc_params: Dict[str, Any]):
    doc_id = doc_params.get("docId")
    if not doc_id:
        return {"error": "No docId provided"}

    relevant_chunks = [d for d in global_state.documents_store if d["doc_id"] == doc_id]
    if not relevant_chunks:
        return {"error": "No chunks found for this docId"}

    combined_text = "\n".join([rc["text"] for rc in relevant_chunks])
    categories = ["Family Law", "Contract Law", "Trade Law", "Criminal Law", "Other"]
    cat_str = ", ".join(categories)

    prompt = (
        f"Classify the following text into one of these categories: {cat_str}.\n\n"
        f"Text:\n{combined_text}\n\n"
        f"Answer with only one category name:\nCategory:"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    result, error = call_gemini_api(payload)
    if error:
        return {"error": error}

    classification = result["answer"].strip()
    if classification not in categories:
        classification = "Other"

    return {"classification": classification}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Modularized RAG Microservice!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)