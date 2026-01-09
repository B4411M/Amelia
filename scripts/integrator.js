/**
 * ============================================
 * AMELIA AI - CENTRAL INTEGRATOR
 * Menghubungkan semua komponen JS menjadi satu sistem
 * ============================================
 */

class AmeliaIntegrator {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.centralAI = null;
    }

    // Inisialisasi semua komponen
    async init() {
        console.log('🚀 Amelia Integrator: Starting...');
        
        // 1. Load AI Connection first (Puter.js)
        await this.initAIConnection();
        
        // 2. Load Storage (IndexedDB)
        await this.initStorage();
        
        // 3. Load Voice Manager
        await this.initVoice();
        
        // 4. Load Smart Router (Indonesian NLP)
        this.initSmartRouter();
        
        // 5. Load Plugin Manager
        await this.initPlugins();
        
        // 6. Load Image Manager
        this.initImageManager();
        
        // 7. Load Neural Trainer
        await this.initNeuralTrainer();
        
        // 8. Load Collaboration Manager
        await this.initCollaboration();
        
        // 9. Load Academic Tools
        this.initAcademicTools();
        
        this.isInitialized = true;
        console.log('✅ Amelia Integrator: All systems ready!');
        
        // Broadcast ready event
        this.broadcast('amelia-ready', { components: Object.keys(this.components) });
        
        return true;
    }

    // AI Connection (Puter.js)
    async initAIConnection() {
        try {
            if (window.AIConnection) {
                const result = await window.AIConnection.initialize();
                if (result.success) {
                    this.components.ai = window.AIConnection;
                    this.centralAI = window.AIConnection;
                    console.log('✅ AI Connection ready');
                }
            }
        } catch (error) {
            console.warn('⚠️ AI Connection not available:', error.message);
        }
    }

    // IndexedDB Storage
    async initStorage() {
        try {
            window.ameliaDB = new IndexedDBManager();
            await window.ameliaDB.init();
            this.components.storage = window.ameliaDB;
            console.log('✅ Storage ready');
        } catch (error) {
            console.warn('⚠️ Storage init failed:', error.message);
        }
    }

    // Voice Manager
    async initVoice() {
        try {
            window.voiceManager = new VoiceManager();
            await window.voiceManager.init();
            this.components.voice = window.voiceManager;
            
            // Connect voice to AI
            if (this.components.voice && this.centralAI) {
                window.voiceManager.onSpeechResult = async (result) => {
                    if (result.isFinal && result.confidence > 0.6) {
                        // Send to AI
                        if (window.ameliaAI) {
                            window.ameliaAI.messageInput.value = result.transcript;
                            await window.ameliaAI.sendMessage();
                        }
                    }
                };
            }
            
            console.log('✅ Voice Manager ready');
        } catch (error) {
            console.warn('⚠️ Voice Manager failed:', error.message);
        }
    }

    // Smart Router (Indonesian NLP)
    initSmartRouter() {
        try {
            window.smartRouter = new SmartQuestionClassifier();
            this.components.router = window.smartRouter;
            console.log('✅ Smart Router ready');
        } catch (error) {
            console.warn('⚠️ Smart Router failed:', error.message);
        }
    }

    // Plugin Manager
    async initPlugins() {
        try {
            window.pluginManager = new PluginManager();
            await window.pluginManager.init();
            this.components.plugins = window.pluginManager;
            console.log('✅ Plugin Manager ready');
        } catch (error) {
            console.warn('⚠️ Plugin Manager failed:', error.message);
        }
    }

    // Image Manager
    initImageManager() {
        try {
            window.imageManager = new ImageManager();
            window.imageManager.init();
            this.components.images = window.imageManager;
            console.log('✅ Image Manager ready');
        } catch (error) {
            console.warn('⚠️ Image Manager failed:', error.message);
        }
    }

    // Neural Network Trainer
    async initNeuralTrainer() {
        try {
            window.neuralTrainer = new NeuralNetworkTrainer();
            await window.neuralTrainer.init();
            this.components.neural = window.neuralTrainer;
            console.log('✅ Neural Trainer ready');
        } catch (error) {
            console.warn('⚠️ Neural Trainer failed:', error.message);
        }
    }

    // Collaboration Manager
    async initCollaboration() {
        try {
            window.collabManager = new CollaborationManager();
            await window.collabManager.init();
            this.components.collab = window.collabManager;
            console.log('✅ Collaboration Manager ready');
        } catch (error) {
            console.warn('⚠️ Collaboration Manager failed:', error.message);
        }
    }

    // Academic Tools
    initAcademicTools() {
        try {
            window.academicTools = new AcademicTools();
            window.academicTools.init();
            this.components.academic = window.academicTools;
            console.log('✅ Academic Tools ready');
        } catch (error) {
            console.warn('⚠️ Academic Tools failed:', error.message);
        }
    }

    // Get component by name
    get(name) {
        return this.components[name] || null;
    }

    // Send message through AI with routing
    async sendToAI(message) {
        if (!this.centralAI) {
            throw new Error('AI not connected');
        }

        // Use smart router for better handling
        if (this.components.router) {
            const analysis = this.components.router.classify(message);
            console.log('📊 Message classified as:', analysis.category);
        }

        return await this.centralAI.chat(message);
    }

    // Save chat to storage
    async saveChat(chatId, messages) {
        if (this.components.storage) {
            await this.components.storage.createChat(chatId);
            for (const msg of messages) {
                await this.components.storage.addMessage(chatId, msg.content, msg.sender);
            }
        }
    }

    // Broadcast event to all components
    broadcast(event, data) {
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    // Get system status
    getStatus() {
        const status = {};
        for (const [name, component] of Object.entries(this.components)) {
            status[name] = component ? 'active' : 'inactive';
        }
        return status;
    }
}

// Create global integrator instance
window.ameliaIntegrator = new AmeliaIntegrator();

// Quick access shortcuts
window.getAI = () => window.ameliaIntegrator?.get('ai');
window.getStorage = () => window.ameliaIntegrator?.get('storage');
window.getVoice = () => window.ameliaIntegrator?.get('voice');
window.getRouter = () => window.ameliaIntegrator?.get('router');
window.getPlugins = () => window.ameliaIntegrator?.get('plugins');
window.getImages = () => window.ameliaIntegrator?.get('images');
window.getNeural = () => window.ameliaIntegrator?.get('neural');
window.getCollab = () => window.ameliaIntegrator?.get('collab');
window.getAcademic = () => window.ameliaIntegrator?.get('academic');

// Send message shortcut
window.sendToAI = async (message) => {
    return await window.ameliaIntegrator?.sendToAI(message);
};

// Get all components status
window.systemStatus = () => {
    return window.ameliaIntegrator?.getStatus() || {};
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Amelia Integrator loaded');
    await window.ameliaIntegrator?.init();
});

console.log('✅ Amelia Integrator ready to use!');

