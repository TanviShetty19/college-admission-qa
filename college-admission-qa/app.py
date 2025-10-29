from flask import Flask, render_template, request, jsonify
import json
import os
from config import Config
from utils.nlp_processor import QAPreprocessor, IntentClassifier
from utils.response_generator import ResponseGenerator

app = Flask(__name__)
app.config.from_object(Config)

# Initialize components
qa_processor = QAPreprocessor()
intent_classifier = IntentClassifier()

def load_knowledge_base():
    """Load knowledge base from JSON file"""
    try:
        with open(app.config['KNOWLEDGE_BASE_PATH'], 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Knowledge base file not found. Using empty knowledge base.")
        return {'faqs': []}

knowledge_base = load_knowledge_base()
response_generator = ResponseGenerator(knowledge_base)

@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_question():
    """Handle question asking endpoint"""
    try:
        data = request.get_json()
        user_question = data.get('question', '').strip()
        
        if not user_question:
            return jsonify({
                'error': 'Please provide a question'
            }), 400
        
        # Find best matching FAQ
        matched_faq, confidence = qa_processor.find_best_match(
            user_question, 
            knowledge_base.get('faqs', [])
        )
        
        # Classify intent
        intent = intent_classifier.classify_intent(user_question)
        
        # Generate response
        response = response_generator.generate_response(
            user_question, 
            matched_faq, 
            confidence
        )
        
        response.update({
            'intent': intent,
            'original_question': user_question
        })
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}',
            'answer': 'Sorry, I encountered an error. Please try again.',
            'confidence': 0,
            'source': 'error'
        }), 500

@app.route('/suggestions')
def get_suggestions():
    """Get popular questions suggestions"""
    popular_questions = [
        "What are the application deadlines?",
        "What documents are required for admission?",
        "What is the tuition fee structure?",
        "Are scholarships available?",
        "What programs do you offer?",
        "What are the English language requirements?"
    ]
    return jsonify({'suggestions': popular_questions})

@app.route('/admin')
def admin():
    """Admin page for knowledge base management"""
    return render_template('admin.html')

@app.route('/api/faqs', methods=['GET'])
def get_faqs():
    """Get all FAQs (API endpoint)"""
    return jsonify(knowledge_base.get('faqs', []))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])