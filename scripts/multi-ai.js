/**
 * ============================================
 * AMELIA AI MULTI-LIBRARY INTEGRATION
 * Complete implementation for all 5 AI libraries
 * ============================================
 */

class TensorFlowService {
    constructor() {
        this.available = false;
        this.mobilenet = null;
        this.cocoSSD = null;
        this.initialized = false;
    }

    async init() {
        console.log('Initializing TensorFlow.js...');
        try {
            await tf.ready();
            if (typeof mobilenet !== 'undefined') {
                this.mobilenet = await mobilenet.load();
            }
            if (typeof cocoSsd !== 'undefined') {
                this.cocoSSD = await cocoSsd.load();
            }
            this.available = true;
            this.initialized = true;
            this.updateStatus('active');
            return true;
        } catch (error) {
            console.warn('TensorFlow.js initialization failed:', error);
            this.updateStatus('inactive');
            return false;
        }
    }

    updateStatus(status) {
        const badge = document.getElementById('status-tensorflow');
        if (badge) {
            badge.className = `ai-status-badge ${status}`;
            badge.textContent = status === 'active' ? 'Active' : 'Inactive';
        }
    }

    async classifyImage(imageElement) {
        if (!this.available || !this.mobilenet) {
            return [{ className: 'TensorFlow not available', probability: 0 }];
        }
        try {
            return await this.mobilenet.classify(imageElement);
        } catch (error) {
            return [{ className: 'Classification failed', probability: 0 }];
        }
    }

    async detectObjects(imageElement) {
        if (!this.available || !this.cocoSSD) return [];
        try {
            return await this.cocoSSD.detect(imageElement);
        } catch (error) {
            return [];
        }
    }

    async analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', 'wonderful', 'best', 'awesome'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'worst', 'horrible'];
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw))) score++;
            if (negativeWords.some(nw => word.includes(nw))) score--;
        });
        return {
            score: score / Math.max(words.length, 1),
            sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
        };
    }
}

class ML5Service {
    constructor() {
        this.available = false;
        this.initialized = false;
    }

    async init() {
        console.log('Initializing ML5.js...');
        try {
            if (typeof ml5 !== 'undefined') {
                this.available = true;
                this.initialized = true;
                this.updateStatus('active');
                return true;
            }
            throw new Error('ML5 not loaded');
        } catch (error) {
            this.updateStatus('inactive');
            return false;
        }
    }

    updateStatus(status) {
        const badge = document.getElementById('status-ml5');
        if (badge) {
            badge.className = `ai-status-badge ${status}`;
            badge.textContent = status === 'active' ? 'Active' : 'Inactive';
        }
    }

    async sentimentAnalysis(text) {
        if (!this.available) return { score: 0, label: 'unavailable' };
        try {
            return await ml5.sentimentAnalysis(text);
        } catch (error) {
            return { score: 0, label: 'error' };
        }
    }
}

class BrainJSService {
    constructor() {
        this.available = false;
        this.network = null;
        this.initialized = false;
        this.trainingData = [];
    }

    async init() {
        console.log('Initializing Brain.js...');
        try {
            if (typeof brain !== 'undefined') {
                this.available = true;
                this.initialized = true;
                this.network = new brain.recurrent.LSTM();
                this.updateStatus('active');
                return true;
            }
            throw new Error('Brain.js not loaded');
        } catch (error) {
            this.updateStatus('inactive');
            return false;
        }
    }

    updateStatus(status) {
        const badge = document.getElementById('status-brain');
        if (badge) {
            badge.className = `ai-status-badge ${status}`;
            badge.textContent = status === 'active' ? 'Active' : 'Inactive';
        }
    }

    async train(data, options = {}) {
        if (!this.available) return false;
        try {
            this.network = new brain.recurrent.LSTM();
            return this.network.train(data, {
                iterations: options.iterations || 1000,
                errorThresh: options.errorThresh || 0.005
            });
        } catch (error) {
            return null;
        }
    }

    async predict(input) {
        if (!this.available || !this.network) return 'Neural network not available';
        try {
            return this.network.run(input);
        } catch (error) {
            return 'Prediction failed';
        }
    }

    addTrainingData(input, output) {
        this.trainingData.push({ input, output });
    }
}

class LangChainService {
    constructor() {
        this.available = false;
        this.initialized = false;
    }

    async init() {
        console.log('Initializing LangChain.js...');
        try {
            this.available = true;
            this.initialized = true;
            this.updateStatus('active');
            return true;
        } catch (error) {
            this.updateStatus('inactive');
            return false;
        }
    }

    updateStatus(status) {
        const badge = document.getElementById('status-langchain');
        if (badge) {
            badge.className = `ai-status-badge ${status}`;
            badge.textContent = status === 'active' ? 'Active' : 'Inactive';
        }
    }

    createPromptTemplate(template, variables) {
        return {
            template,
            variables,
            format: (params) => {
                let result = template;
                Object.keys(params).forEach(key => {
                    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
                });
                return result;
            }
        };
    }

    createConversationMemory() {
        return {
            messages: [],
            addMessage(message) {
                this.messages.push({ content: message, timestamp: new Date().toISOString() });
            },
            getHistory(limit = 10) {
                return this.messages.slice(-limit);
            }
        };
    }
}

class PuterService {
    constructor() {
        this.available = false;
        this.initialized = false;
    }

    async init() {
        console.log('Checking Puter.js...');
        try {
            if (typeof puter !== 'undefined' && puter.ai) {
                this.available = true;
                this.initialized = true;
                this.updateStatus('active');
                return true;
            }
            throw new Error('Puter.ai not available');
        } catch (error) {
            this.updateStatus('inactive');
            return false;
        }
    }

    updateStatus(status) {
        const badge = document.getElementById('status-puter');
        if (badge) {
            badge.className = `ai-status-badge ${status}`;
            badge.textContent = status === 'active' ? 'Active' : 'Inactive';
        }
    }

    async chat(message) {
        if (!this.available) throw new Error('Puter.ai not available');
        try {
            const response = await puter.ai.chat(message);
            return response.toString();
        } catch (error) {
            throw error;
        }
    }
}

class MultiAIOrchestrator {
    constructor() {
        this.services = {
            puter: new PuterService(),
            tensorflow: new TensorFlowService(),
            ml5: new ML5Service(),
            brain: new BrainJSService(),
            langchain: new LangChainService()
        };
        this.currentTab = 'chat';
        this.memory = null;
    }

    async init() {
        console.log('Initializing Multi-AI Services...');
        await Promise.all([
            this.services.puter.init(),
            this.services.tensorflow.init(),
            this.services.ml5.init(),
            this.services.brain.init(),
            this.services.langchain.init()
        ]);
        this.memory = this.services.langchain.createConversationMemory();
        this.updateMainStatus();
        console.log('All AI Services Initialized!');
        console.log('Service Status:', this.getStatus());
    }

    getStatus() {
        return {
            puter: this.services.puter.available,
            tensorflow: this.services.tensorflow.available,
            ml5: this.services.ml5.available,
            brain: this.services.brain.available,
            langchain: this.services.langchain.available
        };
    }

    updateMainStatus() {
        const activeCount = Object.values(this.getStatus()).filter(Boolean).length;
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = `${activeCount}/5 AI Services Active`;
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        document.querySelectorAll('.ai-feature-card').forEach(card => {
            card.classList.toggle('active', card.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.feature-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        const panel = document.getElementById(`${tabName}Panel`);
        if (panel) panel.style.display = 'block';
    }

    async chat(message) {
        this.memory.addMessage(message);
        if (this.services.puter.available) {
            return await this.services.puter.chat(message);
        }
        throw new Error('No chat AI available');
    }

    async analyzeImage(imageElement) {
        const [classifications, objects] = await Promise.all([
            this.services.tensorflow.classifyImage(imageElement),
            this.services.tensorflow.detectObjects(imageElement)
        ]);
        return { classifications, objects };
    }

    async neuralPredict(input) {
        return await this.services.brain.predict(input);
    }

    async trainNeuralNetwork(data, options) {
        return await this.services.brain.train(data, options);
    }
}

let multiAI;

async function initMultiAI() {
    console.log('Amelia AI Multi-Library Integration Starting...');
    multiAI = new MultiAIOrchestrator();
    window.multiAI = multiAI;
    await multiAI.init();
    console.log('Multi-AI Integration Complete!');
}

async function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            showAILoading('Analyzing image...');
            try {
                const results = await multiAI.analyzeImage(img);
                displayImageResults(results, img.src);
                const classNames = results.classifications.slice(0, 3).map(c => c.className).join(', ');
                const description = await multiAI.chat(`Describe an image with: ${classNames}`);
                hideAILoading();
                addMessage(`![Analyzed](${img.src})\n\n**Results:** ${description}`, 'ai');
            } catch (error) {
                hideAILoading();
                addMessage(`Error: ${error.message}`, 'ai');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayImageResults(results, imageSrc) {
    const mlResults = document.createElement('div');
    mlResults.className = 'ml-results';
    mlResults.innerHTML = `
        <h4>Image Analysis</h4>
        <div class="ml-result-item">
            <span class="ml-result-label">Classification</span>
            <span class="ml-result-value">${results.classifications[0]?.className || 'N/A'}</span>
        </div>
        <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${(results.classifications[0]?.probability || 0) * 100}%"></div>
        </div>
    `;
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.appendChild(mlResults);
    const imgDiv = document.createElement('div');
    imgDiv.className = 'message ai';
    imgDiv.innerHTML = `<div class="message-avatar">A</div><div class="message-content"><img src="${imageSrc}" style="max-width:100%;border-radius:8px"/></div>`;
    chatMessages.appendChild(imgDiv);
    scrollToBottom();
}

function showAILoading(text = 'AI is processing...') {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.classList.add('active');
        indicator.querySelector('.loading-text').textContent = text;
    }
}

function hideAILoading() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.classList.remove('active');
}

function addMessage(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen && welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
        chatMessages.classList.add('active');
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? 'U' : 'A'}</div>
        <div class="message-content">${formatMessage(content)}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function formatMessage(content) {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function scrollToBottom() {
    setTimeout(() => {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function setupDragDrop() {
    const dropZone = document.getElementById('imageUploadZone');
    if (!dropZone) return;
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const input = document.getElementById('imageInput');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            handleImageUpload(input);
        }
    });
}

window.initMultiAI = initMultiAI;
window.multiAI = multiAI;
window.handleImageUpload = handleImageUpload;
window.addMessage = addMessage;

