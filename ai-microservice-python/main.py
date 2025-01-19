# main.py
import asyncio
import datetime
import os
import json
import logging
from pathlib import Path
import re
from typing import Any, List, Dict, Optional
import traceback

import faiss
import numpy as np
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from nltk.tokenize import word_tokenize
from dotenv import load_dotenv

from utils.pdf_extractor import PDFExtractor
from utils.rag_processor import ChunkMetadata, RAGProcessor
from utils.query_preprocessor import QueryPreprocessor
from utils.amharic_rag import AmharicRAG
from gemini_helper import call_gemini_api
from summary import summarize_with_gemini

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CACHE_DIR = Path("./cache")
DOCUMENTS_STORE_PATH = CACHE_DIR / "documents_store.json"
FAISS_INDEX_PATH = CACHE_DIR / "faiss_index_file.index"
BM25_STORE_PATH = CACHE_DIR / "bm25_store.json"  # New path for BM25 data
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
        """Initialize or load the FAISS index, BM25, and documents store"""
        self.documents_store = []
        self.tokenized_texts = []
        self.is_initialized = False
        
        # Initialize FAISS index first
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
        
        # Initialize RAG processor
        self.rag_processor = RAGProcessor(
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
            batch_size=32,
            cache_dir=str(CACHE_DIR),
            faiss_index=self.faiss_index
        )
        
        # Load documents store if exists
        if DOCUMENTS_STORE_PATH.exists():
            try:
                with open(DOCUMENTS_STORE_PATH, 'r', encoding='utf-8') as f:
                    self.documents_store = json.load(f)
                logger.info(f"Loaded existing documents store with {len(self.documents_store)} documents")
                
                # Reconstruct chunks metadata from documents
                self.chunks_metadata = []
                for idx, doc in enumerate(self.documents_store):
                    chunk_metadata = ChunkMetadata(
                        doc_id=doc['doc_id'],
                        chunk_id=idx,
                        original_text=doc['text'],
                        processed_text=self._clean_text_for_reload(doc['text']),
                        embedding_idx=idx,
                        special_matches=self._extract_special_matches(doc['text'])
                    )
                    self.chunks_metadata.append(chunk_metadata)
                
                # Update RAG processor with loaded metadata
                self.rag_processor.chunks_metadata = self.chunks_metadata
                
                # Initialize tokenized texts from processed text
                self.tokenized_texts = [
                    chunk_metadata.processed_text.split()
                    for chunk_metadata in self.chunks_metadata
                ]
                
                # Update RAG processor with tokenized texts
                self.rag_processor.tokenized_texts = self.tokenized_texts
                self.rag_processor.update_bm25(self.tokenized_texts)
                
            except Exception as e:
                logger.error(f"Failed to load documents store: {e}")
                self.documents_store = []
                self.chunks_metadata = []
                self.tokenized_texts = []
        else:
            self.chunks_metadata = []
            self.rag_processor.update_bm25([["placeholder"]])
        
        if len(self.documents_store) != len(self.chunks_metadata):
            logger.warning("State inconsistency detected during initialization. Rebuilding state...")
            self.chunks_metadata = []
            for doc in self.documents_store:
                chunk_metadata = ChunkMetadata(
                    doc_id=doc['doc_id'],
                    chunk_id=len(self.chunks_metadata),
                    original_text=doc['text'],
                    processed_text=self._clean_text_for_reload(doc['text']),
                    embedding_idx=len(self.chunks_metadata),
                    special_matches=self._extract_special_matches(doc['text'])
                )
                self.chunks_metadata.append(chunk_metadata)
            
        self.rag_processor.chunks_metadata = self.chunks_metadata
        self.is_initialized = True
        logger.info("System fully initialized with Document store, FAISS index, and BM25.")

    async def save_state(self):
        """Save the current state to disk"""
        try:
            if not self.is_initialized:
                logger.warning("Attempted to save uninitialized state")
                return

            # Save FAISS index
            faiss.write_index(self.faiss_index, str(FAISS_INDEX_PATH))
            
            # Save documents store
            with open(DOCUMENTS_STORE_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.documents_store, f, ensure_ascii=False, indent=2)
            
            # Save BM25 data if available
            if hasattr(self.rag_processor, 'tokenized_texts'):
                bm25_data = {
                    'tokenized_texts': self.rag_processor.tokenized_texts
                }
                with open(BM25_STORE_PATH, 'w', encoding='utf-8') as f:
                    json.dump(bm25_data, f, ensure_ascii=False, indent=2)

            logger.info(f"System state saved successfully with {len(self.documents_store)} documents")
            logger.debug(f"Documents store contents: {self.documents_store}")
            
        except Exception as e:
            logger.error(f"Error saving system state: {e}")
            raise

    
    def _clean_text_for_reload(self, text: str) -> str:
        """Clean text using same logic as RAGProcessor."""
        # Simplified version of RAGProcessor's _clean_text_sync
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _extract_special_matches(self, text: str) -> Dict[str, List[str]]:
        """Extract special matches using same patterns as RAGProcessor."""
        patterns = {
            "article_ref": re.compile(r'article\s+\d+(\.\d+)*'),
            "section_ref": re.compile(r'section\s+\d+(\.\d+)*'),
            "legal_refs": re.compile(r'(?:pursuant to|in accordance with|subject to)'),
            "definitions": re.compile(r'(?:means|refers to|is defined as)')
        }
        
        return {
            name: pattern.findall(text)
            for name, pattern in patterns.items()
        }

    def clear_and_reset_state(self):
        """Clear and reset the system state."""
        try:
            # Reset FAISS index
            self.faiss_index = faiss.IndexFlatIP(DIMENSION)

            # Clear document storage
            self.documents_store = []

            # Reset RAG processor
            self.rag_processor.chunks_metadata = []
            self.rag_processor.tokenized_texts = []
            self.rag_processor.update_index(self.faiss_index)
            self.rag_processor.update_bm25([["placeholder"]])

            # Remove stored files
            for path in [DOCUMENTS_STORE_PATH, FAISS_INDEX_PATH, BM25_STORE_PATH]:
                if path.exists():
                    path.unlink()

            logger.info("System state cleared and reset successfully")
            
            # Save the empty state
            asyncio.create_task(self.save_state())
            
        except Exception as e:
            logger.error(f"Error clearing system state: {e}")
            raise

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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if global_state.is_initialized else "initializing",
        "documents_count": len(global_state.documents_store),
        "chunks_count": len(global_state.rag_processor.chunks_metadata),
        "faiss_size": global_state.faiss_index.ntotal,
        "tokenized_texts": len(global_state.tokenized_texts)
    }

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
        global_state.clear_and_reset_state()  # Remove await here
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
    try:
        logger.info(f"Processing doc_id={doc_id}, pdf_path={pdf_path}")

        # Extract text from PDF
        text = PDFExtractor.extract_content(pdf_path)
        if not text:
            raise HTTPException(status_code=400, detail="No text extracted from PDF")

        # Process document with RAG system
        result = await global_state.rag_processor.process_document(doc_id, text)
        
        # Update documents store with new entries
        current_time = datetime.datetime.utcnow().isoformat()
        filename = os.path.basename(pdf_path)
        
        # Remove any existing entries for this doc_id
        global_state.documents_store = [
            doc for doc in global_state.documents_store 
            if doc["doc_id"] != doc_id
        ]

        # Add new entries from the processed chunks
        for chunk_data in result["chunk_data"]:
            doc_entry = {
                "doc_id": doc_id,
                "title": filename,
                "text": chunk_data["original_text"],
                "index": len(global_state.documents_store),
                "uploadDate": current_time,
                "docScope": doc_scope,
                "category": category,
                "status": "completed"
            }
            global_state.documents_store.append(doc_entry)

        # Save state immediately
        await global_state.save_state()

        logger.info(f"Successfully processed document {doc_id} with {len(result['chunk_data'])} chunks")
        
        return {
            "status": "success",
            "doc_id": doc_id,
            "chunks_added": result["num_chunks"],
            "stats": result["metadata"]
        }

    except Exception as e:
        logger.error(f"Error embedding document: {e}\n{traceback.format_exc()}")
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
        if not global_state.is_initialized:
            logger.warning("Search attempted before system initialization")
            return {"results": [], "status": "system_initializing"}
            
        if not global_state.rag_processor.chunks_metadata:
            logger.warning("Search attempted with empty chunks metadata")
            return {"results": [], "status": "no_documents"}
        if not global_state.documents_store or global_state.rag_processor.index.ntotal == 0:
            return {"results": []}
        
        # Perform hybrid search

        # Process document with RAG system
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

@app.post("/uploadd")
async def upload_document(
    pdf_path: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    docScope: str = Form(...),
    doc_id: str = Form(...)
):
    """Process an Amharic PDF document using a provided file path."""
    try:
        # Validate required fields
        if not title.strip():
            raise HTTPException(status_code=400, detail="Title is required")
        if not category.strip():
            raise HTTPException(status_code=400, detail="Category is required")
        if not docScope.strip():
            raise HTTPException(status_code=400, detail="Document Scope is required")
        if not pdf_path.strip():
            raise HTTPException(status_code=400, detail="PDF path is required")
        
        # Log the received data
        logger.info(f"Received document upload: {title} | {category} | {docScope} | {doc_id} | {pdf_path}")
        
        # Ensure the PDF file exists
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=400, detail="Provided PDF file does not exist")
        
        # Process the document with the RAG system
        logger.info("Processing document with RAG system...")
        result = rag_system.process_document(pdf_path, doc_id)
        
        # Return the result
        return {
            "status": "success",
            "doc_id": doc_id,
            "title": title,
            "category": category,
            "docScope": docScope,
            "processing_result": result
        }

    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/ask")
async def ask_question(
    query: str = Form(...),
    top_k: int = Form(3),
    semantic_weight: float = Form(0.7)
):
    """Ask a question and get raw results with similarity scores."""
    try:
        # Call search_and_answer to get matches and scores
        result = await rag_system.search_and_answer(
            query=query,
            top_k=top_k,
            semantic_weight=semantic_weight
        )

        # Check if the search was successful
        if result["status"] != "success":
            raise HTTPException(status_code=500, detail=result["message"])

        # Return raw JSON for Postman
        return result

    except Exception as e:
        logger.error(f"Error during /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to the Modularized RAG Microservice!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)