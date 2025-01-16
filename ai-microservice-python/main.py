# main.py
import os
import json
import logging
import datetime

from typing import Any, List, Dict
from fastapi import FastAPI, Form, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
import uvicorn # type: ignore
import faiss # type: ignore
import numpy as np
import re
from nltk.tokenize import word_tokenize  # type: ignore # Ensure nltk.tokenize is imported

# Our modular imports
from utils.pdf_extractor import PDFExtractor
from utils.rag_processor import CompleteRAGProcessor
from utils.query_preprocessor import QueryPreprocessor

# Suppose we have these helpers from your prior code
from dotenv import load_dotenv
from gemini_helper import call_gemini_api
from summary import summarize_with_gemini

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File paths
FAISS_INDEX_PATH = "faiss_index_file.index"
DOCUMENTS_STORE_PATH = "documents_store.json"

# Initialize FAISS
DIMENSION = 384  # for "all-MiniLM-L6-v2"
try:
    if os.path.exists(FAISS_INDEX_PATH):
        faiss_index = faiss.read_index(FAISS_INDEX_PATH)
        logger.info("Loaded existing FAISS index")
    else:
        faiss_index = faiss.IndexFlatIP(DIMENSION)
        logger.info("Created new FAISS index")
except Exception as e:
    logger.error(f"Error initializing FAISS index: {e}")
    faiss_index = faiss.IndexFlatIP(DIMENSION)

# Initialize documents store
if os.path.exists(DOCUMENTS_STORE_PATH):
    with open(DOCUMENTS_STORE_PATH, 'r', encoding='utf-8') as f:
        documents_store = json.load(f)
    logger.info("Loaded existing documents store")
else:
    documents_store = []
    logger.info("Created new documents store")

# Create a single global rag_processor instance
rag_processor = CompleteRAGProcessor(
    embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
    batch_size=32,           # adjustable
    use_global_tfidf=False,  # use per-document TF-IDF by default
    faiss_index=faiss_index  # Pass the global FAISS index
)

def save_faiss_state():
    """Persist the FAISS index and documents metadata to disk."""
    try:
        faiss.write_index(faiss_index, FAISS_INDEX_PATH)
        with open(DOCUMENTS_STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(documents_store, f, ensure_ascii=False, indent=2)
        logger.info("FAISS state saved successfully.")
    except Exception as e:
        logger.error(f"Error saving FAISS state: {e}")


@app.post("/embed_document")
async def embed_document(
    doc_id: str = Form(...),
    pdf_path: str = Form(...),
    doc_scope: str = Form(...),
    category: str = Form(...)
):
    """
    - Extract PDF text
    - Pass it to the RAG processor
    - Add embeddings to FAISS
    - Save chunk info in documents_store
    """
    try:
        logger.info(f"Processing doc_id={doc_id}, pdf_path={pdf_path}")

        # 1) Extract text
        text = PDFExtractor.extract_text_from_pdf(pdf_path)
        if not text:
            raise HTTPException(status_code=400, detail="No text extracted from PDF")

        # 2) RAG pipeline
        result = rag_processor.process_document(doc_id, text)

        embeddings = result["embeddings"]
        if embeddings.shape[0] > 0:
            faiss_index.add(embeddings)
        else:
            logger.warning(f"No embeddings generated for doc_id={doc_id}")

        # 3) Store metadata
        current_time = datetime.datetime.utcnow().isoformat()
        filename = os.path.basename(pdf_path)
        # The 'search_index' aligns with 'embeddings'
        for idx, entry in enumerate(result["search_index"]):
            documents_store.append({
                "doc_id": doc_id,
                "title": filename,
                "text": entry["original_chunk"],
                "index": len(documents_store),
                "uploadDate": current_time,
                "docScope": doc_scope,
                "category": category,
                "status": "completed"
            })

        save_faiss_state()

        return {
            "status": "success",
            "doc_id": doc_id,
            "chunks_added": len(result["search_index"]),
            "stats": result["stats"]
        }

    except Exception as e:
        logger.error(f"Error embedding document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{doc_id}/status")
async def get_document_status(doc_id: str):
    try:
        doc_chunks = [doc for doc in documents_store if doc["doc_id"] == doc_id]
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
async def search_similar_chunks(query: str = Form(...), top_k: int = Form(3)):
    try:
        if not documents_store or faiss_index.ntotal == 0:
            return {"results": []}

        qp = QueryPreprocessor()
        processed_query = qp.preprocess_query(query)
        logger.info(f"Search query preprocessed => '{processed_query}'")

        # 1) Exact matches
        exact_matches = []
        lower_q = processed_query.lower()
        for doc in documents_store:
            if lower_q in doc["text"].lower():
                exact_matches.append({
                    "doc_id": doc["doc_id"],
                    "text": doc["text"],
                    "similarity": 1.0,
                    "semantic_score": 1.0,
                    "exact_match_score": 1.0,
                    "match_type": "exact"
                })

        if len(exact_matches) >= top_k:
            return {"results": exact_matches[:top_k]}

        # 2) Semantic search
        remaining_slots = top_k - len(exact_matches)
        if remaining_slots > 0:
            # embed query once
            from sentence_transformers import SentenceTransformer # type: ignore
            model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            q_emb = model.encode([processed_query], convert_to_numpy=True)
            faiss.normalize_L2(q_emb)
            distances, indices = faiss_index.search(q_emb, faiss_index.ntotal)

            semantic_matches = []
            seen_doc_ids = {m["doc_id"] for m in exact_matches}

            for idx, score in zip(indices[0], distances[0]):
                if idx < 0:
                    continue
                doc = documents_store[idx]
                if doc["doc_id"] in seen_doc_ids:
                    continue
                semantic_matches.append({
                    "doc_id": doc["doc_id"],
                    "text": doc["text"],
                    "similarity": float(score),
                    "semantic_score": float(score),
                    "exact_match_score": 0.0,
                    "match_type": "semantic"
                })

            # # After collecting semantic_matches
            # # Define the exact reference pattern based on the query (for example, "article 3")
            # # Adjust this pattern dynamically if you have multiple numeric references
            # reference = processed_query  # assuming processed_query holds the refined query like "article 3"
            # # Create a regex pattern to match the exact reference with word boundaries
            # ref_pattern = re.compile(r'\b' + re.escape(reference) + r'\b', re.IGNORECASE)

            # # Filter semantic matches to only include those that contain the exact reference
            # filtered_semantic_matches = []
            # for match in semantic_matches:
            #     if ref_pattern.search(match["text"]):
            #         filtered_semantic_matches.append(match)

            # # Use filtered_semantic_matches instead of semantic_matches from here on
            # semantic_matches = filtered_semantic_matches

            combined = exact_matches + semantic_matches[:remaining_slots]
            return {"results": combined}

        return {"results": exact_matches}

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qa")
async def rag_qa(query: str = Form(...), context: str = Form(...), top_k: int = Form(3)):
    try:
        retrieval_res = await search_similar_chunks(query, top_k)
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

@app.get("/faiss/index")
async def get_faiss_index_info():
    if faiss_index is None:
        raise HTTPException(status_code=404, detail="FAISS index not found")
    return {
        "faiss_index": {
            "dimension": faiss_index.d,
            "number_of_vectors": faiss_index.ntotal,
            "metric": faiss_index.metric_type
        }
    }

@app.get("/faiss/documents")
async def list_faiss_documents():
    try:
        return {"documents": documents_store}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/faiss/clear")
async def clear_faiss_index():
    global faiss_index, documents_store
    try:
        faiss_index = faiss.IndexFlatIP(DIMENSION)
        documents_store.clear()
        save_faiss_state()
        return {"status": "success", "message": "FAISS index and documents cleared"}
    except Exception as e:
        logger.error(f"Error clearing FAISS index: {e}")
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

    relevant_chunks = [d for d in documents_store if d["doc_id"] == doc_id]
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

    relevant_chunks = [d for d in documents_store if d["doc_id"] == doc_id]
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
