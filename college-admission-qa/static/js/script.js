class ChatApp {
    constructor() {
        this.messageCount = 0;
        this.initializeEventListeners();
        this.loadSuggestions();
        this.updateCurrentTime();
        this.initializeAnimations();
    }

    initializeEventListeners() {
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        const charCount = document.getElementById('charCount');

        sendButton.addEventListener('click', () => this.sendMessage());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        userInput.addEventListener('input', () => {
            const length = userInput.value.length;
            charCount.textContent = `${length}/500`;
            
            if (length > 450) {
                charCount.style.color = 'var(--error-color)';
            } else if (length > 400) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--text-secondary)';
            }
        });

        userInput.addEventListener('input', this.autoResize);
        userInput.focus();
    }

    autoResize(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const question = userInput.value.trim();

        if (!question) {
            this.showNotification('Please enter a question', 'warning');
            return;
        }

        this.addMessage(question, 'user');
        userInput.value = '';
        document.getElementById('charCount').textContent = '0/500';
        userInput.style.height = 'auto';

        this.showTypingIndicator();

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question })
            });

            const data = await response.json();
            this.removeTypingIndicator();

            if (response.ok) {
                this.displayBotResponse(data);
                this.messageCount++;
                this.updateStats();
            } else {
                this.displayError(data.error || 'An error occurred');
            }
        } catch (error) {
            this.removeTypingIndicator();
            this.displayError('Network error. Please check your connection.');
        }
    }

    addMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const avatarIcon = document.createElement('i');
        avatarIcon.className = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(avatarIcon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = this.formatMessage(text);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();

        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);

        if (sender === 'user') {
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(contentDiv);
        }

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: inherit; text-decoration: underline;">$1</a>');
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return text;
    }

    displayBotResponse(data) {
        let responseHTML = data.answer;

        if (data.confidence > 0 && data.confidence < 0.5) {
            responseHTML += ` <span class="confidence-badge"><i class="fas fa-brain"></i> ${Math.round(data.confidence * 100)}% match</span>`;
        }

        this.addMessage(responseHTML, 'bot');

        if (data.suggestions && data.suggestions.length > 0) {
            this.updateSuggestions(data.suggestions);
        }

        if (data.source === 'fallback' && data.contact_info) {
            this.showContactInfo(data.contact_info);
        }
    }

    displayError(errorMessage) {
        this.addMessage(`<i class="fas fa-exclamation-triangle"></i> Sorry, I encountered an error: ${errorMessage}`, 'bot');
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const avatarIcon = document.createElement('i');
        avatarIcon.className = 'fas fa-robot';
        avatar.appendChild(avatarIcon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const typingContainer = document.createElement('div');
        typingContainer.className = 'typing-indicator';
        
        const typingText = document.createElement('span');
        typingText.textContent = 'AI is thinking';
        
        const typingDots = document.createElement('div');
        typingDots.className = 'typing-dots';
        typingDots.innerHTML = '<span></span><span></span><span></span>';

        typingContainer.appendChild(typingText);
        typingContainer.appendChild(typingDots);
        contentDiv.appendChild(typingContainer);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(contentDiv);

        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async loadSuggestions() {
        try {
            const response = await fetch('/suggestions');
            const data = await response.json();
            
            if (data.suggestions) {
                this.updateSuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }

    updateSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = '';

        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.innerHTML = `<i class="fas fa-lightbulb"></i> ${suggestion}`;
            chip.addEventListener('click', () => {
                document.getElementById('userInput').value = suggestion;
                this.sendMessage();
            });
            suggestionsContainer.appendChild(chip);
        });
    }

    showContactInfo(contactInfo) {
        const contactHTML = `
            <br>
            <div style="background: rgba(67, 97, 238, 0.1); padding: 15px; border-radius: 12px; border-left: 4px solid var(--primary-color);">
                <strong><i class="fas fa-life-ring"></i> Need Human Assistance?</strong><br>
                📞 ${contactInfo.admission_office || 'Not available'}<br>
                ✉️ ${contactInfo.email || 'Not available'}<br>
                🕒 ${contactInfo.office_hours || 'Not available'}
            </div>
        `;
        this.addMessage(contactHTML, 'bot');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface-color);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--${type}-color);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = this.getCurrentTime();
        }
    }

    initializeAnimations() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    updateStats() {
        const statsElement = document.querySelector('.stat-number');
        if (statsElement) {
            statsElement.textContent = this.messageCount;
        }
    }
}

// Add loading animation
document.addEventListener('DOMContentLoaded', () => {
    // Simulate loading
    setTimeout(() => {
        new ChatApp();
        document.body.style.opacity = '1';
    }, 500);
});

// Add initial styles for smooth loading
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';