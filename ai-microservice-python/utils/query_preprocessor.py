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
    """
    Cleans a user query (removes noise, lemmatizes, preserves patterns).
    """

    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))

        # Example large set of words to remove or ignore
        self.remove_words = {
            'what','how','why','when','where','who','which',
            'is','are','was','were','am','be','been','do','does','did',
            'can','could','shall'
        }

    def preprocess_query(self, query: str) -> str:
        query = query.lower().strip()
        
        # Fix stuck-together references: article10 -> article 10
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
        
        # Preserve patterns
        for pattern, token_prefix in patterns_to_preserve:
            for match in re.finditer(pattern, query):
                token = f"{token_prefix}_{pattern_counter}"
                preserved_patterns[token] = match.group()
                query = query.replace(match.group(), token)
                pattern_counter += 1

        tokens = word_tokenize(query)
        processed_tokens = []

        for token in tokens:
            # skip punctuation
            if all(ch in string.punctuation for ch in token):
                continue

            if token in preserved_patterns:
                processed_tokens.append(preserved_patterns[token])
                continue

            if token in self.remove_words:
                continue

            # Lemmatize
            from nltk.stem import WordNetLemmatizer
            lemmatized = WordNetLemmatizer().lemmatize(token, pos='v')
            lemmatized = WordNetLemmatizer().lemmatize(lemmatized, pos='n')
            processed_tokens.append(lemmatized)

        result = " ".join(processed_tokens)

        # Restore preserved tokens
        for token, original in preserved_patterns.items():
            result = result.replace(token, original)

        # "article 10 and 11" => "article 10 article 11"
        result = re.sub(
            r'(article\s+\d+(\.\d+)*)\s+and\s+(\d+(\.\d+)*)',
            lambda m: f"{m.group(1)} article {m.group(3)}", 
            result
        )
        # similarly for section references
        result = re.sub(
            r'(section\s+\d+(\.\d+)*)\s+and\s+(\d+(\.\d+)*)',
            lambda m: f"{m.group(1)} section {m.group(3)}", 
            result
        )

        # Remove extra spaces
        result = re.sub(r'\s+', ' ', result).strip()
        print(f"Preprocessed query: {result}")
        return result
