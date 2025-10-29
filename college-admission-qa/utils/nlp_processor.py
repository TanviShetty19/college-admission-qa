import re
import nltk
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

class QAPreprocessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(analyzer='word', stop_words='english')
        
    def preprocess_text(self, text):
        """Clean and preprocess input text"""
        if not text:
            return ""
            
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and short tokens
        tokens = [token for token in tokens if token not in self.stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def find_best_match(self, user_question, faqs):
        """Find the best matching FAQ for user question"""
        if not faqs:
            return None
            
        # Preprocess user question
        processed_question = self.preprocess_text(user_question)
        
        # Prepare corpus of questions and keywords
        corpus = []
        for faq in faqs:
            # Combine question and keywords for better matching
            question_text = f"{faq['question']} {' '.join(faq.get('keywords', []))}"
            processed_faq = self.preprocess_text(question_text)
            corpus.append(processed_faq)
        
        # Add processed user question to corpus
        corpus.append(processed_question)
        
        try:
            # Create TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            
            # Calculate cosine similarity between user question and all FAQs
            cosine_similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])
            
            # Get best match index
            best_match_idx = np.argmax(cosine_similarities)
            best_score = cosine_similarities[0][best_match_idx]
            
            # Return best match if score is above threshold
            if best_score > 0.1:  # Adjust threshold as needed
                return faqs[best_match_idx], best_score
            else:
                return None, best_score
                
        except Exception as e:
            print(f"Error in similarity calculation: {e}")
            return None, 0

class IntentClassifier:
    def __init__(self):
        self.categories = {
            'deadline': ['deadline', 'when', 'date', 'last date', 'apply by'],
            'documents': ['document', 'required', 'submit', 'paper', 'transcript'],
            'fees': ['fee', 'tuition', 'cost', 'price', 'scholarship'],
            'programs': ['program', 'course', 'major', 'degree', 'study'],
            'contact': ['contact', 'email', 'phone', 'call', 'reach'],
            'requirements': ['requirement', 'eligibility', 'gpa', 'score', 'need']
        }
    
    def classify_intent(self, text):
        """Classify user intent based on keywords"""
        text = text.lower()
        scores = {}
        
        for category, keywords in self.categories.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[category] = score
        
        if scores:
            return max(scores.items(), key=lambda x: x[1])[0]
        return 'general'