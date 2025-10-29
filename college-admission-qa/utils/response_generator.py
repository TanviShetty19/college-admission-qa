import random

class ResponseGenerator:
    def __init__(self, knowledge_base):
        self.knowledge_base = knowledge_base
        self.fallback_responses = [
            "I'm not sure I understand. Could you rephrase your question?",
            "I don't have information about that specific topic. Try asking about admission deadlines, requirements, or programs.",
            "That's a good question! Currently, I don't have enough information to answer it. Please contact our admission office for detailed assistance.",
            "I'm still learning about college admissions. Could you ask about application processes, fees, or programs?",
            "I don't have the answer to that yet. You might find this information on our website or by contacting admissions."
        ]
    
    def generate_response(self, user_question, matched_faq=None, confidence=0):
        """Generate appropriate response based on match confidence"""
        
        if matched_faq and confidence > 0.3:
            # High confidence match
            response = {
                'answer': matched_faq['answer'],
                'confidence': round(confidence, 2),
                'category': matched_faq.get('category', 'general'),
                'source': 'knowledge_base',
                'suggestions': self._get_related_suggestions(matched_faq['category'])
            }
        elif matched_faq and confidence > 0.1:
            # Low confidence match - provide answer but acknowledge uncertainty
            response = {
                'answer': f"I think you're asking about {matched_faq['question'].lower()}?\n\n{matched_faq['answer']}",
                'confidence': round(confidence, 2),
                'category': matched_faq.get('category', 'general'),
                'source': 'knowledge_base_low_confidence',
                'suggestions': self._get_related_suggestions(matched_faq['category'])
            }
        else:
            # No good match found
            response = {
                'answer': random.choice(self.fallback_responses),
                'confidence': 0,
                'category': 'unknown',
                'source': 'fallback',
                'contact_info': self.knowledge_base.get('contact_info', {}),
                'suggestions': self._get_general_suggestions()
            }
        
        return response
    
    def _get_related_suggestions(self, category):
        """Get related questions based on category"""
        suggestions = {
            'deadlines': ["What documents are required?", "What is the application process?", "Can I get an extension?"],
            'documents': ["What is the application deadline?", "How to submit documents?", "Document format requirements"],
            'fees': ["Scholarship opportunities", "Payment plans", "Additional fees"],
            'programs': ["Admission requirements", "Program duration", "Career opportunities"],
            'general': ["Application deadlines", "Required documents", "Tuition fees", "Program offerings"]
        }
        return suggestions.get(category, suggestions['general'])
    
    def _get_general_suggestions(self):
        """Get general suggestions for unknown questions"""
        return [
            "What are the application deadlines?",
            "What documents do I need to submit?",
            "How much is the tuition fee?",
            "What programs do you offer?",
            "What are the admission requirements?"
        ]