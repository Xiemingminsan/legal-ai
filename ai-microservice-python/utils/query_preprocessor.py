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
            'can','could','shall','should','will','would','might','must',
            'has','have','had','having','the','a','an','and','or','but',
            'in','on','at','to','for','of','with','by','from','up','down',
            'into','onto','out','about','as','across','along','through','over',
            'under','around','between','please','kindly','okay','ok','thanks',
            'thank','welcome','hi','hello','hey','yo','dear','regards','bye',
            'alright','fine','now','then','later','today','tomorrow','yesterday',
            'soon','earlier','before','after','already','yet','just','sometimes',
            'never','always','whenever','often','rarely','show','tell','explain',
            'list','find','search','get','give','help','fix','need','require',
            'want','looking','see','check','look','display','provide','say','ask',
            'let','make','know','suggest','recommend','advise','clarify','solve',
            'resolve','i','me','my','we','our','us','you','your','yours','they',
            'them','their','he','she','it','his','hers','its','this','that','these',
            'those','mine','theirs','there','myself','yourself','himself','herself',
            'itself','ourselves','yourselves','themselves','more','less','many',
            'few','several','some','any','all','none','most','every','each','lot',
            'lots','plenty','much','quite','very','really','rather','too','enough',
            'almost','entirely','partially','bit','tiny','huge','large','small',
            'www','com','http','https','site','website','page','link','click',
            'browse','read','open','close','file','folder','document','text',
            'content','section','chapter','paragraph','article','clause','rule',
            'regulation','policy','condition','status','case','instance','example',
            'illustration','note','okay','ok','cool','sure','yes','no','uh','um',
            'uhh','umm','hm','hmm','oops','oopsie','oh','ah','haha','maybe',
            'perhaps','sort','kind','type','sorta','kinda','basically','actually',
            'literally','like','just','so','well','anyway','thing','things','such',
            'etc','stuff','during','including','until','against','among','throughout',
            'despite','towards','upon','concerning','beyond','within','alongside',
            'ahead','apart','aside','inside','outside','because','therefore','though',
            'although','however','meanwhile','something','anything','everything',
            'nothing','whatever','whenever','whoever','wherever','whichever','anybody',
            'nobody','everybody','let me','let us','would you','could you','should you',
            'can you','shall we','might we','is it','is there','are there','fine','yep',
            'nope','surely','nah','yeah','indeed','okey','yup','yo','welp','whoa','huh',
            'gosh','golly','geez','oh no','oops','wow','haha','lol','rofl','lmao','hehe',
            'type','types','kind','kinds','category','categories','form','forms','manner',
            'manners','way','ways','method','methods','sort','sorts'
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
