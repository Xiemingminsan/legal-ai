# query_preprocessor.py
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download required NLTK data (do once somewhere in your app initialization)
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)


class QueryPreprocessor:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        # Reduce the stop words set to keep more meaningful terms
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by','okay', 'ok', 'yes'
        }
        
    def preprocess_query(self, query: str) -> str:
        query = query.lower().strip()
        
        # First preserve article and section references with their context
        # This will keep phrases like "requirements in article 10" intact
        preserved_contexts = {}
        context_counter = 0
        
        # Find article/section references with surrounding context (3 words before and after)
        for pattern in [r'article\s+\d+(\.\d+)*', r'section\s+\d+(\.\d+)*']:
            for match in re.finditer(pattern, query):
                start, end = match.span()
                
                # Get surrounding words
                before = query[:start].split()[-3:]
                after = query[end:].split()[:3]
                
                # Create context phrase
                context = ' '.join(before + [match.group()] + after).strip()
                token = f"PRESERVED_CONTEXT_{context_counter}"
                preserved_contexts[token] = context
                
                # Replace in query
                query = query[:max(0, start - len(' '.join(before)) - 1)] + \
                       f" {token} " + \
                       query[min(len(query), end + len(' '.join(after)) + 1):]
                context_counter += 1
        
        # Basic cleaning
        tokens = word_tokenize(query)
        processed_tokens = []
        
        for token in tokens:
            if token in preserved_contexts:
                processed_tokens.append(preserved_contexts[token])
                continue
                
            # Keep more words by reducing stop word removal
            if token in self.stop_words or all(ch in string.punctuation for ch in token):
                continue
                
            # Lighter lemmatization - only for verbs
            lemmatized = self.lemmatizer.lemmatize(token, pos='v')
            processed_tokens.append(lemmatized)
            
        result = " ".join(processed_tokens)
        
        # Clean up extra spaces
        result = re.sub(r'\s+', ' ', result).strip()
        print(f"Preprocessed query: {result}")
        return result