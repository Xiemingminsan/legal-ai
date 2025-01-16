# rag_processor.py
import re
import numpy as np
import spacy # type: ignore
from sentence_transformers import SentenceTransformer # type: ignore
from sklearn.feature_extraction.text import TfidfVectorizer # type: ignore
import faiss # type: ignore
from collections import defaultdict
from typing import List, Dict

class CompleteRAGProcessor:
    """
    - Splits text into chunks (via spaCy)
    - (Optionally) fits TF-IDF per document or uses a global TF-IDF 
    - Creates a search index with important terms & patterns
    - Batches embeddings for improved efficiency
    - Applies weighting (article references, legal phrases, TF-IDF scores)
    """
    def __init__(
        self,
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        batch_size: int = 32,
        use_global_tfidf: bool = False,
        faiss_index = None
    ):
        """
        :param embedding_model_name: model ID for SentenceTransformer
        :param batch_size: batch size for embeddings
        :param use_global_tfidf: if True, this class expects an externally provided
                                 (tfidf_matrix, feature_names) instead of calling
                                 self.tfidf.fit_transform() per document
        """
        self.nlp = spacy.load("en_core_web_sm")
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.batch_size = batch_size
        self.use_global_tfidf = use_global_tfidf
        self.faiss_index = faiss_index

        # TF-IDF for doc-based usage
        self.tfidf = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=50000,
            stop_words="english"
        )

        # Patterns for identifying references
        self.legal_patterns = {
            "article_ref": r"article\s+\d+",
            "section_ref": r"section\s+\d+",
            "legal_refs": r"(?:pursuant to|in accordance with|subject to)",
            "definitions": r"(?:means|refers to|is defined as)"
        }

        # Patterns to remove noise
        self.noise_patterns = [
            r"\b(?:the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b",
            r"\b(?:shall|may|must|can|will|would|could|should)\b",
            r"\s+",
        ]

    def process_document(
        self,
        doc_id: str,
        text: str,
        global_tfidf_matrix: np.ndarray = None,
        global_feature_names: List[str] = None
    ) -> Dict:
        """
        1. Generate base chunks
        2. Create search index
        3. Generate RAG chunks
        4. Batch-generate embeddings with weighting
        5. Return stats
        :param global_tfidf_matrix: if using global TF-IDF, pass the row(s) relevant to this doc
        :param global_feature_names: the feature names from the global tfidf
        """
        raw_chunks = self._generate_base_chunks(text)
        print(f"Split document {doc_id} into {len(raw_chunks)} chunks.")

        # Build or use TF-IDF
        if self.use_global_tfidf and global_tfidf_matrix is not None and global_feature_names is not None:
            # If you're using a global TF-IDF approach, you'll need to slice the rows
            # relevant to this doc. Implementation depends on your strategy.
            print("Using global TF-IDF.")
            search_index = self._create_search_index_with_global_tfidf(raw_chunks, doc_id, global_tfidf_matrix, global_feature_names)
        else:
            print("Fitting TF-IDF per document.")
            # Standard approach: Fit TF-IDF on this doc's chunks
            search_index = self._create_search_index(raw_chunks, doc_id)

        rag_chunks = self._create_rag_chunks(raw_chunks, doc_id)
        print(f"Created {len(rag_chunks)} RAG chunks.")
        embeddings = self._generate_smart_embeddings(search_index)
        print(f"Processed document {doc_id} with {len(raw_chunks)} chunks.")

        return {
            "doc_id": doc_id,
            "rag_chunks": rag_chunks,
            "search_index": search_index,
            "embeddings": embeddings,
            "stats": self._calculate_doc_stats(raw_chunks, search_index)
        }

    def _generate_base_chunks(self, text: str, max_size: int = 300) -> List[str]:
        """
        Use spaCy's sentence segmentation and custom logic to 
        create base chunks capped at max_size tokens.
        """
        doc = self.nlp(text)
        chunks = []
        current_chunk = []
        current_length = 0

        for sent in doc.sents:
            # Check for start of an 'article'
            is_article_start = bool(re.search(self.legal_patterns["article_ref"], sent.text, re.IGNORECASE))
            sentence_len = len(sent.text.split())

            # Start new chunk if we exceed max_size or see an article boundary
            if (current_length + sentence_len > max_size) or (is_article_start and current_chunk):
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_length = 0

            current_chunk.append(sent.text)
            current_length += sentence_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    def _create_search_index(self, chunks: List[str], doc_id: str) -> List[Dict]:
        """
        Fit TF-IDF on these chunks, store important terms, special matches, cleaned text, etc.
        """
        tfidf_matrix = self.tfidf.fit_transform(chunks)
        feature_names = self.tfidf.get_feature_names_out()

        search_index = []
        for idx, (chunk, row_scores) in enumerate(zip(chunks, tfidf_matrix.toarray())):
            cleaned_text = self._clean_for_search(chunk)
            important_terms = {
                feature_names[i]: score
                for i, score in enumerate(row_scores)
                if score > 0
            }
            special_matches = {
                pat_name: re.findall(pat, chunk, re.IGNORECASE)
                for pat_name, pat in self.legal_patterns.items()
            }
            search_index.append({
                "chunk_id": idx,
                "doc_id": doc_id,
                "search_text": cleaned_text,
                "important_terms": important_terms,
                "special_matches": special_matches,
                "original_chunk": chunk
            })
        return search_index

    def _create_search_index_with_global_tfidf(
        self, chunks: List[str], doc_id: str,
        global_tfidf_matrix: np.ndarray, global_feature_names: List[str]
    ) -> List[Dict]:
        """
        Example placeholder if you have a single global TF-IDF
        for the entire corpus. You'd need to slice out the relevant 
        rows or do partial vectorization for these chunks, etc.
        """
        # In a real approach, you'd do something like:
        # chunk_vectors = self.tfidf.transform(chunks)  # if the same tfidf is used
        # or slice from global_tfidf_matrix if you stored row offsets for each doc.
        # For demonstration, we'll do the transform:
        tfidf_matrix = self.tfidf.transform(chunks)  # reusing the same fitted vectorizer
        feature_names = global_feature_names

        search_index = []
        for idx, (chunk, row_scores) in enumerate(zip(chunks, tfidf_matrix.toarray())):
            cleaned_text = self._clean_for_search(chunk)
            important_terms = {
                feature_names[i]: score
                for i, score in enumerate(row_scores)
                if score > 0
            }
            special_matches = {
                pat_name: re.findall(pat, chunk, re.IGNORECASE)
                for pat_name, pat in self.legal_patterns.items()
            }
            search_index.append({
                "chunk_id": idx,
                "doc_id": doc_id,
                "search_text": cleaned_text,
                "important_terms": important_terms,
                "special_matches": special_matches,
                "original_chunk": chunk
            })
        return search_index

    def _create_rag_chunks(self, chunks: List[str], doc_id: str) -> List[Dict]:
        """
        Build list of chunk dicts that include some context if needed.
        """
        rag_chunks = []
        for idx, chunk in enumerate(chunks):
            prev_chunk = chunks[idx - 1] if idx > 0 else ""
            next_chunk = chunks[idx + 1] if idx < len(chunks) - 1 else ""
            rag_chunks.append({
                "chunk_id": idx,
                "doc_id": doc_id,
                "text": chunk,
                "context": {
                    "previous": prev_chunk,
                    "next": next_chunk
                }
            })
        return rag_chunks

    def _clean_for_search(self, text: str) -> str:
        """
        Basic cleaning while preserving certain patterns
        """
        preserved = {}
        for name, pattern in self.legal_patterns.items():
            it = re.finditer(pattern, text, re.IGNORECASE)
            for i, match in enumerate(it):
                key = f"PRESERVED_{name}_{i}"
                preserved[key] = match.group()
                text = text.replace(match.group(), key)

        # Remove noise
        for pattern in self.noise_patterns:
            text = re.sub(pattern, " ", text, flags=re.IGNORECASE)

        # Restore
        for k, v in preserved.items():
            text = text.replace(k, v)

        # Normalize spaces
        text = " ".join(text.split())
        return text

    def _generate_smart_embeddings(self, search_index: List[Dict]) -> np.ndarray:
        """
        **Batch** embed the chunks, then apply weighting logic.
        """
        # 1) Collect texts
        texts = [entry["search_text"] for entry in search_index]
        if not texts:
            return np.array([])
        print(f"Generating embeddings for {len(texts)} chunks.")

        # 2) Batch encode once
        base_embeddings = self.embedding_model.encode(
            texts, batch_size=self.batch_size, show_progress_bar=False
        )  # shape: (num_chunks, embedding_dim)

        embeddings = []
        for idx, entry in enumerate(search_index):
            base_emb = base_embeddings[idx]
            weight = 1.0
            if entry["special_matches"].get("article_ref"):
                weight *= 1.5
            if entry["special_matches"].get("legal_refs"):
                weight *= 1.2

            if entry["important_terms"]:
                avg_term_importance = np.mean(list(entry["important_terms"].values()))
                weight *= (1.0 + avg_term_importance)

            weighted_emb = base_emb * weight
            embeddings.append(weighted_emb)


        embeddings = np.array(embeddings, dtype=np.float32)
        success = self.add_embeddings_to_index(embeddings)
        if not success:
            faiss.normalize_L2(embeddings)
        return embeddings

    def _calculate_doc_stats(self, raw_chunks: List[str], search_index: List[Dict]) -> Dict:
        return {
            "total_chunks": len(raw_chunks),
            "avg_chunk_length": float(np.mean([len(c.split()) for c in raw_chunks])),
            "special_pattern_counts": self._count_special_patterns(search_index),
            "term_importance_summary": self._summarize_term_importance(search_index)
        }

    def _count_special_patterns(self, search_index: List[Dict]) -> Dict:
        counts = defaultdict(int)
        for entry in search_index:
            for pattern_name, matches in entry["special_matches"].items():
                counts[pattern_name] += len(matches)
        return dict(counts)

    def _summarize_term_importance(self, search_index: List[Dict]) -> Dict:
        term_scores = defaultdict(list)
        for entry in search_index:
            for term, score in entry["important_terms"].items():
                term_scores[term].append(score)
        # Return only terms with average TF-IDF > 0.1
        return {
            t: float(np.mean(scores))
            for t, scores in term_scores.items()
            if np.mean(scores) > 0.1
        }
    
    def add_embeddings_to_index(self, embeddings):
        """
        Safely adds embeddings to the global FAISS index with proper error handling
        and normalization.
        """
        try:
            # Access the global faiss_index
            global faiss_index

            # Convert to numpy array if not already
            if not isinstance(embeddings, np.ndarray):
                embeddings = np.array(embeddings, dtype=np.float32)

            # Check if embeddings is empty
            if embeddings.shape[0] == 0:
                print("No embeddings to add")
                return False

            # Ensure correct dimensionality
            if len(embeddings.shape) != 2:
                raise ValueError(f"Embeddings must be a 2D array, got shape {embeddings.shape}")

            # Check if dimensions match the index
            if embeddings.shape[1] != faiss_index.d:
                raise ValueError(f"Embedding dimension {embeddings.shape[1]} does not match index dimension {faiss_index.d}")

            # Ensure float32 dtype
            embeddings = embeddings.astype(np.float32)

            # Normalize embeddings in-place
            faiss.normalize_L2(embeddings)

            # Add to the global FAISS index
            faiss_index.add(embeddings)
            return True

        except Exception as e:
            print(f"Error adding embeddings to index: {str(e)}")
            return False
