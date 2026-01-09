/**
 * ============================================
 * AMELIA AI - MAIN APPLICATION
 * Sistem utama yang mengelola semua fitur
 * ============================================
 */

// Global state
window.AMELIA_STATE = {
    version: '3.0.0',
    mode: 'chat', // chat, voice, image, academic
    isReady: false,
    user: null,
    settings: {}
};

class AmeliaApp {
    constructor() {
        this.ui = {};
        this.managers = {};
        this.isInitialized = false;
    }

    async init() {
        console.log('🚀 Amelia App: Starting...');
        
        // Wait for integrator
        await this.waitForIntegrator();
        
        // Setup UI references
        this.setupUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize AI connection
        await this.initAI();
        
        // Show ready state
        this.isInitialized = true;
        window.AMELIA_STATE.isReady = true;
        
        console.log('✅ Amelia App ready!');
        
        return true;
    }

    async waitForIntegrator() {
        // Wait up to 5 seconds for integrator
        let attempts = 0;
        while (!window.ameliaIntegrator && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        if (window.ameliaIntegrator) {
            await window.ameliaIntegrator.init();
            this.managers = window.ameliaIntegrator.components;
        }
    }

    setupUI() {
        this.ui = {
            // Containers
            welcomeScreen: document.getElementById('welcomeScreen'),
            chatMessages: document.getElementById('chatMessages'),
            inputArea: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            
            // Status
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            welcomeDescription: document.getElementById('welcomeDescription'),
            suggestionChips: document.getElementById('suggestionChips'),
            
            // Voice
            voiceControls: document.getElementById('voiceControls'),
            voiceStatus: document.getElementById('voiceStatus'),
            
            // Input wrapper
            inputWrapper: document.querySelector('.input-wrapper'),
            footerNote: document.querySelector('.footer-note')
        };
    }

    setupEventListeners() {
        // Send message
        this.ui.sendButton?.addEventListener('click', () => this.sendMessage());
        
        // Input events
        this.ui.inputArea?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.ui.inputArea?.addEventListener('input', () => {
            this.updateSendButton();
            this.autoResize();
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
                        this.ui.inputArea?.focus();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.toggleVoiceMode();
                        break;
                }
            }
        });
    }

    async initAI() {
        this.updateStatus('connecting', 'Tunggu...');
        
        const ai = this.managers.ai || window.AIConnection;
        
        if (ai) {
            try {
                const result = await ai.initialize();
                
                if (result.success) {
                    this.updateStatus('online', 'Siap');
                    this.enableChat();
                    this.ui.welcomeDescription.textContent = "Saya siap membantu! Tanyakan apa saja.";
                    
                    if (this.ui.suggestionChips) {
                        this.ui.suggestionChips.style.display = 'flex';
                    }
                    
                    // Show voice controls if available
                    if (this.managers.voice && this.ui.voiceControls) {
                        this.ui.voiceControls.style.display = 'flex';
                    }
                    
                    return;
                }
            } catch (error) {
                console.error('AI init error:', error);
            }
        }
        
        // Retry logic
        await this.retryAIInit();
    }

    async retryAIInit() {
        let attempts = 0;
        const maxAttempts = 15;
        
        while (attempts < maxAttempts) {
            attempts++;
            this.updateStatus('connecting', `Tunggu... (${attempts}/${maxAttempts})`);
            
            try {
                const ai = this.managers.ai || window.AIConnection;
                if (ai) {
                    const result = await ai.retryConnection();
                    if (result.success) {
                        this.updateStatus('online', 'Siap');
                        this.enableChat();
                        this.ui.welcomeDescription.textContent = "Saya siap membantu! Tanyakan apa saja.";
                        
                        if (this.ui.suggestionChips) {
                            this.ui.suggestionChips.style.display = 'flex';
                        }
                        
                        return;
                    }
                }
            } catch (error) {
                // Continue retrying
            }
            
            await new Promise(r => setTimeout(r, 2000));
        }
        
        this.updateStatus('error', 'Connection Failed');
        this.ui.welcomeDescription.textContent = "Tidak dapat terhubung ke AI. Silakan refresh halaman.";
    }

    updateStatus(type, text) {
        if (!this.ui.statusDot) return;
        
        this.ui.statusDot.className = 'status-dot';
        
        if (type === 'connecting') {
            this.ui.statusDot.classList.add('connecting');
        } else if (type === 'error') {
            this.ui.statusDot.classList.add('error');
        } else if (type === 'online') {
            this.ui.statusDot.classList.add('online');
        }
        
        this.ui.statusText.textContent = text;
    }

    enableChat() {
        if (this.ui.inputArea) {
            this.ui.inputArea.disabled = false;
            this.updateSendButton();
            this.ui.inputArea.focus();
        }
    }

    updateSendButton() {
        if (!this.ui.sendButton) return;
        
        const hasContent = this.ui.inputArea?.value.trim().length > 0;
        const aiReady = this.managers.ai?.available || window.AIConnection?.available;
        
        this.ui.sendButton.disabled = !hasContent || !aiReady;
    }

    autoResize() {
        if (!this.ui.inputArea) return;
        
        this.ui.inputArea.style.height = 'auto';
        this.ui.inputArea.style.height = Math.min(this.ui.inputArea.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.ui.inputArea?.value.trim();
        const ai = this.managers.ai || window.AIConnection;
        
        if (!message || !ai?.available) return;
        
        // Hide welcome, show chat
        if (this.ui.welcomeScreen?.style.display !== 'none') {
            this.ui.welcomeScreen.style.display = 'none';
            this.ui.chatMessages?.classList.add('active');
        }
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.ui.inputArea.value = '';
        this.updateSendButton();
        this.autoResize();
        
        // Show loading
        this.showLoading();
        
        try {
            // Get AI response
            const response = await ai.chat(message);
            
            // Add AI response with typing effect
            await this.addAIMessage(response);
            
        } catch (error) {
            console.error('AI Error:', error);
            this.addMessage(`Maaf, terjadi kesalahan: ${error.message}`, 'ai');
        } finally {
            this.hideLoading();
        }
    }

    addMessage(content, sender) {
        if (!this.ui.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.dataset.content = content;
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(content);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.ui.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    async addAIMessage(content) {
        if (!this.ui.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Typing effect
        contentDiv.innerHTML = '<span class="typing-effect"></span>';
        const typingSpan = contentDiv.querySelector('.typing-effect');
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.ui.chatMessages.appendChild(messageDiv);
        
        // Animate typing
        await this.typeText(typingSpan, content);
        
        // Apply final formatting
        typingSpan.innerHTML = this.formatMessage(content);
        
        this.scrollToBottom();
    }

    async typeText(element, text) {
        const words = text.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            element.textContent = currentText;
            this.scrollToBottom();
            
            const delay = Math.random() * 50 + 30;
            await new Promise(r => setTimeout(r, delay));
        }
    }

    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showLoading() {
        this.ui.loadingIndicator?.classList.add('active');
        this.scrollToBottom();
    }

    hideLoading() {
        this.ui.loadingIndicator?.classList.remove('active');
    }

    scrollToBottom() {
        if (this.ui.chatMessages) {
            setTimeout(() => {
                this.ui.chatMessages.scrollTop = this.ui.chatMessages.scrollHeight;
            }, 50);
        }
    }

    toggleVoiceMode() {
        const voice = this.managers.voice;
        if (!voice) return;
        
        if (voice.isListening) {
            voice.stopListening();
        } else {
            voice.startListening();
        }
    }

    // Utility methods
    clearChat() {
        if (!confirm('Hapus riwayat chat?')) return;
        
        this.ui.chatMessages.innerHTML = '';
        this.ui.welcomeScreen.style.display = 'flex';
        this.ui.chatMessages.classList.remove('active');
        
        // Clear AI history
        const ai = this.managers.ai || window.AIConnection;
        ai?.clearHistory();
    }

    exportChat() {
        const messages = Array.from(this.ui.chatMessages.querySelectorAll('.message'));
        const data = {
            date: new Date().toISOString(),
            messages: messages.map(m => ({
                sender: m.classList.contains('user') ? 'user' : 'ai',
                content: m.dataset.content,
                timestamp: new Date().toISOString()
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amelia-chat-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
}

// Global functions
window.ameliaApp = null;

window.sendMessage = function() {
    window.ameliaApp?.sendMessage();
};

window.useSuggestion = function(text) {
    if (window.ameliaApp?.ui.inputArea) {
        window.ameliaApp.ui.inputArea.value = text;
        window.ameliaApp.sendMessage();
    }
};

window.clearChat = function() {
    window.ameliaApp?.clearChat();
};

window.exportChat = function() {
    window.ameliaApp?.exportChat();
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Amelia App initializing...');
    window.ameliaApp = new AmeliaApp();
    await window.ameliaApp.init();
});

console.log('✅ Amelia Main App loaded!');

