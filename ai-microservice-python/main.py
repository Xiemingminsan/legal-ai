import datetime
import json
import os
import concurrent.futures
import uvicorn
import faiss
import numpy as np
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, JSONResponse as jsonify
from sentence_transformers import SentenceTransformer
from gemini_helper import call_gemini_api
from summary import summarize_with_gemini
from typing import Any, List, Dict
from pathlib import Path
import logging
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
load_dotenv(dotenv_path="../backend-node/.env")

# AI configuration
USE_LOCAL_LLM = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"

GEMINI_API_URL = os.getenv("GEMINI_API_URL")  # e.g., "https://api.mistral.ai/v1/chat/completions"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # if needed
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

import re
import logging
from typing import List
import pdfplumber
import numpy as np
import faiss
import spacy
from fastapi import HTTPException
from sentence_transformers import SentenceTransformer
from nltk.tokenize import sent_tokenize

# Initialize global resources
logger = logging.getLogger(__name__)
nlp = spacy.load('en_core_web_sm')
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
nlp.max_length = 2_000_000

# Configuration constants
CHUNK_SIZE = 300        # Max tokens per chunk (adjustable)
OVERLAP_SENTENCES = 2   # Number of previous sentences for context enrichment
BATCH_SIZE = 32         # Batch size for embedding

class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        try:
            with pdfplumber.open(pdf_path) as pdf:
            # Process pages in parallel
                def process_page(page):
                    page_text = page.extract_text()
                    if page_text:
                    # Remove trailing numbers or noise
                        return re.sub(r"\s*\d+\s*$", "", page_text)
                    return ""

                with concurrent.futures.ThreadPoolExecutor() as executor:
                    texts = executor.map(process_page, pdf.pages)

            # Combine all page texts
            text = "\n".join(text.strip() for text in texts if text.strip())

            if not text.strip():
                raise ValueError("No extractable text found in the PDF.")

            logger.info(f"Extracted {len(text.split())} words from PDF.")
            return text.strip()

        except FileNotFoundError:
            logger.error(f"PDF file not found: {pdf_path}")
            raise HTTPException(status_code=404, detail="PDF file not found.")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")


    @staticmethod
    def chunk_text(text: str, max_chunk_size: int = CHUNK_SIZE) -> List[str]:
        """
        Semantic-aware text chunking using spaCy to maintain sentence boundaries.
        Adjusts chunk size dynamically and preserves context with overlap.
        """
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents]
        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence_len = len(sentence.split())
            # If adding sentence stays within chunk limit, add it
            if current_length + sentence_len <= max_chunk_size:
                current_chunk.append(sentence)
                current_length += sentence_len
            else:
                # Finalize current chunk
                chunks.append(" ".join(current_chunk))
                # Start new chunk with overlap from previous sentences
                overlap = current_chunk[-OVERLAP_SENTENCES:] if len(current_chunk) >= OVERLAP_SENTENCES else current_chunk
                current_chunk = overlap + [sentence]
                current_length = sum(len(s.split()) for s in current_chunk)

        # Append any remaining sentences as last chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))

        logger.info(f"Generated {len(chunks)} semantic chunks.")
        return chunks

    @staticmethod
    def context_enriched_chunking(chunks: List[str], window_size: int = OVERLAP_SENTENCES) -> List[str]:
        """
        Enrich each chunk by appending context from previous chunks.
        """
        enriched_chunks = []
        for i in range(len(chunks)):
            # Concatenate previous `window_size` chunks as context
            context = " ".join(chunks[max(0, i - window_size):i])
            enriched_chunk = f"{context}\n{chunks[i]}" if context else chunks[i]
            enriched_chunks.append(enriched_chunk)
        logger.info(f"Enriched {len(enriched_chunks)} chunks with context.")
        return enriched_chunks

    @staticmethod
    def batch_embed(chunks: List[str], batch_size: int = BATCH_SIZE, min_chunk_size: int = 5) -> np.ndarray:
        """
        Embed chunks in batches, filtering out very small ones, and normalizing vectors.
        """
        all_embeddings = []

        for i in range(0, len(chunks), batch_size):
            # Filter out chunks that are too small to embed meaningfully
            batch = [chunk for chunk in chunks[i:i + batch_size] if len(chunk.split()) >= min_chunk_size]
            if not batch:
                continue
            embeddings = embedding_model.encode(batch, convert_to_numpy=True)
            faiss.normalize_L2(embeddings)
            all_embeddings.append(embeddings)

        if all_embeddings:
            final_embeddings = np.vstack(all_embeddings)
            faiss.normalize_L2(final_embeddings)  # Normalize final array
            logger.info(f"Embedded {len(final_embeddings)} chunks.")
            return final_embeddings
        else:
            logger.warning("No valid chunks to embed.")
            return np.array([])

# Example usage:
# text = DocumentProcessor.extract_text_from_pdf("sample.pdf")
# chunks = DocumentProcessor.chunk_text(text)
# enriched_chunks = DocumentProcessor.context_enriched_chunking(chunks)
# embeddings = DocumentProcessor.batch_embed(enriched_chunks)

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
        
        print(f"Extracted {len(chunks)} chunks from document {doc_id}")
        
        # Enrich chunks with context
        enriched_chunks = DocumentProcessor.context_enriched_chunking(chunks)

        print(f"Enriched {len(enriched_chunks)} chunks with context")
        print(enriched_chunks)
            
        # Generate embeddings
        embeddings = DocumentProcessor.batch_embed(enriched_chunks)
        
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
    

import re
import string
from typing import List, Set
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('punkt_tab')

class QueryPreprocessor:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        self.remove_words = {
            # Common question words
            'what', 'how', 'why', 'when', 'where', 'who', 'which',

            # Auxiliary verbs and modal verbs
            'is', 'are', 'was', 'were', 'am', 'be', 'been', 'do', 'does', 'did', 
            'can', 'could', 'shall', 'should', 'will', 'would', 'might', 'must',
            'has', 'have', 'had', 'having',

            # Articles, conjunctions, and prepositions
            'the', 'a', 'an', 'and', 'or', 'but', 
            'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
            'from', 'up', 'down', 'into', 'onto', 'out', 'about', 'as',
            'across', 'along', 'through', 'over', 'under', 'around', 'between',

            # Politeness and casual fillers
            'please', 'kindly', 'okay', 'ok', 'thanks', 'thank', 'welcome', 
            'hi', 'hello', 'hey', 'yo', 'dear', 'regards', 'bye', 'alright', 'fine',
            
            # Temporal fillers
            'now', 'then', 'later', 'today', 'tomorrow', 'yesterday', 
            'soon', 'earlier', 'before', 'after', 'already', 'yet', 'just',
            'sometimes', 'never', 'always', 'whenever', 'often', 'rarely',

            # Request-related terms
            'show', 'tell', 'explain', 'list', 'find', 'search', 'get', 'give', 
            'help', 'fix', 'need', 'require', 'want', 'looking', 'see', 'check', 
            'look', 'display', 'provide', 'say', 'ask', 'let', 'make', 'know',
            'suggest', 'recommend', 'advise', 'clarify', 'solve', 'resolve',

            # Pronouns
            'i', 'me', 'my', 'we', 'our', 'us', 'you', 'your', 'yours', 
            'they', 'them', 'their', 'he', 'she', 'it', 'his', 'hers', 'its', 
            'this', 'that', 'these', 'those', 'mine', 'theirs','there', 'myself', 'yourself',
            'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',

            # Quantifiers and comparisons
            'more', 'less', 'many', 'few', 'several', 'some', 'any', 'all', 
            'none', 'most', 'every', 'each', 'lot', 'lots', 'plenty', 'much', 
            'quite', 'very', 'really', 'rather', 'too', 'enough', 'almost', 
            'entirely', 'partially', 'bit', 'tiny', 'huge', 'large', 'small',

            # Internet or technical terms
            'www', 'com', 'http', 'https', 'site', 'website', 'page', 'link', 
            'click', 'browse', 'read', 'open', 'close', 'file', 'folder', 
            'document', 'text', 'content', 'section', 'chapter', 'paragraph',

            # Domain-specific casual terms
            'article', 'clause', 'rule', 'regulation', 'policy', 'condition', 
            'status', 'case', 'instance', 'example', 'illustration', 'note',

            # Repetitive or verbose terms
            'okay', 'ok', 'fine', 'alright', 'cool', 'sure', 'yes', 'no', 'uh', 
            'um', 'uhh', 'umm', 'hm', 'hmm', 'oops', 'oopsie', 'oh', 'ah', 'haha', 

            # Synonyms for redundant phrases
            'maybe', 'perhaps', 'sort', 'kind', 'type', 'sorta', 'kinda', 
            'bit', 'quite', 'basically', 'actually', 'literally', 'like', 'just', 
            'so', 'well', 'anyway', 'thing', 'things', 'such', 'etc', 'stuff',

            # Contextual fillers
            'during', 'including', 'until', 'against', 'among', 'throughout', 
            'despite', 'towards', 'upon', 'concerning', 'beyond', 'within',
            'alongside', 'ahead', 'apart', 'aside', 'inside', 'outside',
            'because', 'therefore', 'though', 'although', 'however', 'meanwhile',
            
            # Placeholder words
            'something', 'anything', 'everything', 'nothing', 'whatever', 'whenever', 
            'whoever', 'wherever', 'whichever', 'anybody', 'nobody', 'everybody',
            
            # Expressions
            'let me', 'let us', 'would you', 'could you', 'should you', 
            'can you', 'shall we', 'might we', 'is it', 'is there', 'are there',

            # Additional random fillers
            'fine', 'yep', 'nope', 'surely', 'nah', 'yeah', 'indeed', 'okey',
            'yup', 'yo', 'welp', 'whoa', 'huh', 'gosh', 'golly', 'geez', 
            'oh no', 'oops', 'wow', 'haha', 'lol', 'rofl', 'lmao', 'hehe',

            #Others
            'type', 'types', 'kind', 'kinds', 'category', 'categories', 'form', 'forms',
            'manner', 'manners', 'way', 'ways', 'method', 'methods', 'sort', 'sorts',
        }
        
        self.query_expansions = {
            "article": ["section", "provision", "clause", "regulation"],
            "paragraph": ["para", "section", "subsection"],
            "regulation": ["rule", "directive", "guideline", "provision"],
            "amendment": ["modification", "change", "revision", "update"],
            "requirement": ["requirement", "obligation", "condition", "prerequisite"],
            "api": ["endpoint", "interface", "service"],
            "error": ["exception", "failure", "fault", "bug"],
            "config": ["configuration", "setting", "parameter"],
            "database": ["db", "data", "storage"],
            "function": ["method", "procedure", "routine"],
            "example": ["instance", "case", "illustration"],
            "difference": ["distinction", "comparison", "contrast"],
            "meaning": ["definition", "interpretation", "explanation"],
            "use": ["usage", "application", "implementation"],
            "problem": ["issue", "error", "difficulty", "bug"]
        }

    def preprocess_query(self, query: str) -> str:
        """
        Preprocesses the query while preserving important patterns.
        """
        # Convert to lowercase
        query = query.lower().strip()
        
        # Fix stuck-together article/section patterns, preserving decimals
        query = re.sub(r'(article|section)(\d+(\.\d+)*)', r'\1 \2', query, flags=re.IGNORECASE)
        
        preserved_patterns = {}
        pattern_counter = 0
        
        patterns_to_preserve = [
            (r'article\s+\d+(\.\d+)*', 'ARTICLE'),
            (r'section\s+\d+(\.\d+)*', 'SECTION'),
            (r'version\s+\d+(\.\d+)*', 'VERSION'),
            (r'v\d+(\.\d+)*', 'VERSION'),
            (r'error\s+\d+', 'ERROR'),
            (r'\d+\.\d+\.\d+', 'VERSION')
        ]
        
        # Save and replace patterns to preserve
        for pattern, token_prefix in patterns_to_preserve:
            for match in re.finditer(pattern, query):
                token = f"{token_prefix}_{pattern_counter}"
                preserved_patterns[token] = match.group()
                query = query.replace(match.group(), token)
                pattern_counter += 1
        
        # Tokenize
        tokens = word_tokenize(query)
        
        processed_tokens = []
        for token in tokens:
            # Skip punctuation tokens
            if all(char in string.punctuation for char in token):
                continue
            
            # Restore preserved patterns immediately
            if token in preserved_patterns:
                processed_tokens.append(preserved_patterns[token])
                continue
                
            # Skip tokens in the removal list
            if token.lower() in self.remove_words:
                continue
                
            # Lemmatize token
            lemmatized = self.lemmatizer.lemmatize(token, pos='v')
            lemmatized = self.lemmatizer.lemmatize(lemmatized, pos='n')
            
            processed_tokens.append(lemmatized)
        
        result = ' '.join(processed_tokens)
        
        # Restore preserved patterns in the final result
        for token, original in preserved_patterns.items():
            result = result.replace(token, original)
        
        # Handle conjoined article references: "article X and Y" -> "article X article Y"
        result = re.sub(r'(article\s+\d+(\.\d+)*)\s+and\s+(\d+(\.\d+)*)', 
                        lambda m: f"{m.group(1)} article {m.group(3)}", result)
        
        # Handle conjoined section references: "section X and Y" -> "section X section Y"
        result = re.sub(r'(section\s+\d+(\.\d+)*)\s+and\s+(\d+(\.\d+)*)', 
                        lambda m: f"{m.group(1)} section {m.group(3)}", result)
        
        # Final cleanup: remove extra spaces
        result = re.sub(r'\s+', ' ', result).strip()
        
        return result
        
@app.post("/search")
async def search_similar_chunks(query: str = Form(...), top_k: int = Form(3)):
    try:
        if not documents_store:
            return {"results": []}
        
        try:
            faiss_index = faiss.read_index("faiss_index_file.index")
        except Exception as e:
            logger.error(f"FAISS index loading error: {e}")
            return {"results": []}
        
        query_processor = QueryPreprocessor()
        processed_query = query_processor.preprocess_query(query)
        print(f"Processed query: {processed_query}")
        
        # First, look for exact phrase matches
        exact_matches = []
        query_lower = processed_query.lower().strip()
        
        for idx, doc in enumerate(documents_store):
            text_lower = doc["text"].lower()
            
            # Check for exact phrase match
            if query_lower in text_lower:
                # Find word boundaries to ensure it's a complete phrase match
                for match in re.finditer(r'\b' + re.escape(query_lower) + r'\b', text_lower):
                    exact_matches.append({
                        "doc_id": doc["doc_id"],
                        "text": doc["text"],
                        "similarity": 1.0,
                        "semantic_score": 1.0,
                        "exact_match_score": 1.0,
                        "match_type": "exact"
                    })
        
        # If we have enough exact matches, return them
        if len(exact_matches) >= top_k:
            return {"results": exact_matches[:top_k]}
        
        # If we need more results, perform semantic search
        remaining_slots = top_k - len(exact_matches)
        if remaining_slots > 0:
            query_embedding = embedding_model.encode([processed_query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)
            distances, indices = faiss_index.search(query_embedding, len(documents_store))
            
            semantic_results = []
            seen_doc_ids = {match["doc_id"] for match in exact_matches}
            
            for idx, semantic_score in zip(indices[0], distances[0]):
                if idx != -1:
                    doc = documents_store[idx]
                    
                    # Skip if we already have this document in exact matches
                    if doc["doc_id"] in seen_doc_ids:
                        continue
                    
                    semantic_results.append({
                        "doc_id": doc["doc_id"],
                        "text": doc["text"],
                        "similarity": float(semantic_score),
                        "semantic_score": float(semantic_score),
                        "exact_match_score": 0.0,
                        "match_type": "semantic"
                    })
            
            # Combine exact matches with top semantic results
            combined_results = exact_matches + semantic_results[:remaining_slots]
            return {"results": combined_results}
        
        return {"results": exact_matches}
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qa")
async def rag_qa(query: str = Form(...),context: str = Form(...), top_k: int = Form(3)):
    try:
        # Step 1: Retrieve similar chunks
        retrieval_res = await search_similar_chunks(query, top_k)
        chunks = retrieval_res.get("results", [])

        if not chunks:
            return {
                "answer": "No documents in the index yet.",
                "chunksUsed": []
            }

        # Step 2: Build context string
        context_texts = [context]
        for c in chunks:
            context_texts.append(f"Chunk from doc {c['doc_id']}:\n{c['text']}\n")
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
                    f"   - The last 5 messages for conversational relevance.\n"
                    f"   - The conversation summary for broader context.\n\n"

                    f"2. For follow-up questions:\n"
                    f"   - Check the last 5 messages to identify what the user is referring to.\n"
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


        # Step 3: Create the payload for the Gemini API
        result, error = call_gemini_api(payload)
        if error:
            logger.error(error)
            return {"answer": error, "chunksUsed": chunks}

        return {
            "answer": result["answer"],
            "chunksUsed": chunks,
            "geminiMetadata": result["geminiMetadata"]
        }

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

@app.post("/summarize")
async def summarize(conversationText: str = Form(...)):
    """
    Endpoint to summarize a conversation.
    Expects conversationText as form-encoded input.
    """
    try:
        # Call the summarize function
        summary = summarize_with_gemini(conversationText)
        if not summary:
            raise HTTPException(status_code=500, detail="Failed to summarize the conversation.")

        # Return the summary
        return {"summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# In main.py (Python)
@app.post("/summarize_doc")
def summarize_doc(doc_params: Dict[str, Any]):
    """
    Summarize or extract key points from a doc's chunks.
    doc_params: { "docId": str, "mode": "summary" | "keypoints" }
    """
    doc_id = doc_params.get("docId")
    mode =  "summary"

    # 1. Gather all chunks for doc_id
    relevant_chunks = [d for d in documents_store if d["doc_id"] == doc_id]
    if not relevant_chunks:
        return {"error": "No chunks found for this documentId."}

    # 2. Combine text
    combined_text = "\n".join([rc["text"] for rc in relevant_chunks])
    
    # 3. Prepare prompt
    if mode == "summary":
        prompt = f"Summarize the following text:\n\n{combined_text}\n\nSummary:"
    else:
        # e.g. "keypoints" or "analysis"
        prompt = f"Extract the key points from the following text in bullet form:\n\n{combined_text}\n\nKey Points:"

    # 4. Call Gemini or local LLM
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

    # 5. Return the result
    summary_text = result["answer"]  # adapt to your gemini structure
    return {"summary": summary_text}


@app.on_event("startup")
async def startup_event():
    global faiss_index, documents_store
    faiss_index, documents_store = initialize_faiss()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Legal AI Microservice!"}

if __name__ == "__main__":
    # # Load FAISS index and documents_ store from disk if exists
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
