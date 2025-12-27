// Amelia AI Chat Application
class AmeliaAI {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.themeToggle = document.getElementById('themeToggle');
        this.suggestionChips = document.querySelectorAll('.suggestion-chip');
        
        this.isLoading = false;
        this.messageHistory = [];
        this.currentTheme = localStorage.getItem('amelia-theme') || 'light';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupPuterJS();
        this.loadChatHistory();
        this.setupAutoResize();
    }
    
    setupEventListeners() {
        // Send message events
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Input events
        this.messageInput.addEventListener('input', () => this.updateSendButton());
        this.messageInput.addEventListener('input', () => this.autoResize());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Suggestion chips
        this.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const message = chip.getAttribute('data-message');
                this.messageInput.value = message;
                this.updateSendButton();
                this.autoResize();
                this.sendMessage();
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.sendMessage();
                        break;
                    case '/':
                        e.preventDefault();
                        this.messageInput.focus();
                        break;
                }
            }
        });
        
        // Window resize for responsive adjustments
        window.addEventListener('resize', () => this.handleResize());
    }
    
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('amelia-theme', this.currentTheme);
        this.updateThemeIcon();
    }
    
    updateThemeIcon() {
        const icon = this.themeToggle.querySelector('svg');
        if (this.currentTheme === 'dark') {
            icon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            `;
        } else {
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            `;
        }
    }
    
    setupPuterJS() {
        // Check if Puter.js is loaded
        if (typeof puter === 'undefined') {
            console.warn('Puter.js not loaded, using fallback AI responses');
            this.puterAvailable = false;
        } else {
            this.puterAvailable = true;
            console.log('Puter.js loaded successfully');
            
            // Initialize Puter.js if needed
            if (puter.ai && typeof puter.ai.chat === 'function') {
                this.aiChat = puter.ai.chat;
            }
        }
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Hide welcome screen on first message
        if (this.welcomeScreen.style.display !== 'none') {
            this.welcomeScreen.style.display = 'none';
        }
        
        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.updateSendButton();
        this.autoResize();
        
        // Show loading
        this.showLoading();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Add AI response
            this.addMessage(response, 'ai');
            
            // Save to history
            this.saveToHistory(message, response);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        } finally {
            this.hideLoading();
        }
    }
    
    async getAIResponse(message) {
        if (this.puterAvailable && this.aiChat) {
            try {
                // Use Puter.js AI chat if available
                const response = await this.aiChat(message);
                return response || this.getFallbackResponse(message);
            } catch (error) {
                console.error('Puter.js AI error:', error);
                return this.getFallbackResponse(message);
            }
        } else {
            // Fallback responses
            return this.getFallbackResponse(message);
        }
    }
    
    getFallbackResponse(message) {
        const responses = [
            "I understand you're asking about \"" + message + "\". While I can't provide real-time responses without a backend service, this is a demonstration of the Amelia AI interface. In a full implementation, this would connect to advanced AI services.",
            "That's an interesting question about \"" + message + "\". The Amelia AI interface is designed to be responsive and user-friendly. With proper AI integration, I would provide detailed responses to your queries.",
            "Thank you for your message about \"" + message + "\". This chat interface demonstrates modern web design with responsive layout, theme switching, and smooth animations. The actual AI responses would come from integrated services.",
            "I see you're interested in \"" + message + "\". This is a showcase of the Amelia AI website built with responsive design principles. The full version would include real AI conversation capabilities.",
            "Your message \"" + message + "\" shows the interactive capabilities of this chat interface. The responsive design works across all devices, and with proper AI backend integration, this would be a fully functional intelligent assistant."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'U' : 'A';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Process content for formatting
        contentDiv.innerHTML = this.formatMessage(content);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    showLoading() {
        this.isLoading = true;
        this.loadingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideLoading() {
        this.isLoading = false;
        this.loadingIndicator.style.display = 'none';
    }
    
    updateSendButton() {
        const hasContent = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasContent || this.isLoading;
    }
    
    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    saveToHistory(userMessage, aiResponse) {
        const chatHistory = {
            user: userMessage,
            ai: aiResponse,
            timestamp: new Date().toISOString()
        };
        
        this.messageHistory.push(chatHistory);
        
        // Keep only last 50 messages to prevent storage bloat
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(-50);
        }
        
        localStorage.setItem('amelia-chat-history', JSON.stringify(this.messageHistory));
    }
    
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('amelia-chat-history');
            if (saved) {
                this.messageHistory = JSON.parse(saved);
                
                // Show last 10 messages from history
                const recentHistory = this.messageHistory.slice(-10);
                recentHistory.forEach(chat => {
                    this.addMessage(chat.user, 'user');
                    this.addMessage(chat.ai, 'ai');
                });
                
                if (this.messageHistory.length > 0) {
                    this.welcomeScreen.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    handleResize() {
        // Adjust chat container height on resize
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.chatMessages.innerHTML = '';
            this.messageHistory = [];
            localStorage.removeItem('amelia-chat-history');
            this.welcomeScreen.style.display = 'flex';
        }
    }
    
    exportChat() {
        if (this.messageHistory.length === 0) {
            alert('No chat history to export.');
            return;
        }
        
        const exportData = {
            exportDate: new Date().toISOString(),
            totalMessages: this.messageHistory.length,
            conversations: this.messageHistory
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amelia-ai-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set viewport height for mobile browsers
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', debounce(setVH, 100));
    
    // Initialize Amelia AI
    window.ameliaAI = new AmeliaAI();
    
    // Add some demo interactions for showcase
    setTimeout(() => {
        if (window.ameliaAI.messageHistory.length === 0) {
            console.log('🤖 Amelia AI initialized successfully!');
            console.log('💡 Try typing a message or click on suggestion chips to start chatting.');
            console.log('🌙 Use the theme toggle in the header to switch between light and dark modes.');
            console.log('⌨️  Keyboard shortcuts: Ctrl/Cmd + Enter to send, Ctrl/Cmd + / to focus input');
        }
    }, 1000);
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be registered here for offline functionality
        console.log('🔧 Service Worker support detected');
    });
}

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AmeliaAI };
}
