/**
 * ============================================
 * AMELIA AI - MAIN ORCHESTRATOR
 * Smart AI Router untuk optimal resource usage
 * ============================================
 */

class AmeliaOrchestrator {
    constructor() {
        // Initialize core components
        this.classifier = new SmartQuestionClassifier();
        this.cache = new ResponseCacheManager();
        this.puterLoader = new LazyPuterLoader({
            autoLoad: false, // Load hanya saat dibutuhkan
            timeout: 30000,
            retryAttempts: 2
        });
        
        // State
        this.isInitialized = false;
        this.messageQueue = [];
        this.currentRequest = null;
        this.stats = {
            totalMessages: 0,
            localResponses: 0,
            puterResponses: 0,
            cacheHits: 0,
            startTime: Date.now()
        };
        
        // Settings
        this.settings = {
            useCache: true,
            cacheTTL: 24 * 60 * 60 * 1000, // 24 jam
            preferLocal: true,
            showSourceIndicator: true,
            typingEffect: true
        };
    }
    
    // ========== INITIALIZATION ==========
    
    async init() {
        console.log('🎯 Amelia Orchestrator initializing...');
        
        // Setup Puter callbacks
        this.puterLoader.onLoad((ai) => {
            console.log('✅ Puter.js is ready');
            this.processQueue();
        });
        
        this.puterLoader.onError((error) => {
            console.warn('⚠️ Puter.js error:', error.message);
        });
        
        // Clean expired cache entries
        this.cache.cleanExpired();
        
        this.isInitialized = true;
        console.log('✅ Amelia Orchestrator ready!');
        console.log(`📊 Cache: ${this.cache.getStats().size} entries`);
        
        return this;
    }
    
    // ========== MAIN PROCESSING ==========
    
    /**
     * Process user message dan return appropriate response
     */
    async processMessage(message) {
        this.stats.totalMessages++;
        
        const startTime = Date.now();
        
        try {
            // Step 1: Classification
            const classification = this.classifier.classify(message);
            console.log(`[Orchestrator] Category: ${classification.category}, NeedsAI: ${classification.needsAI}`);
            
            // Step 2: Check cache
            if (this.settings.useCache && !classification.needsLocal) {
                const cached = this.cache.get(message);
                if (cached) {
                    this.stats.cacheHits++;
                    return {
                        success: true,
                        response: cached.data,
                        source: `cache (${cached.source})`,
                        responseTime: Date.now() - startTime,
                        category: classification.category,
                        isCached: true
                    };
                }
            }
            
            // Step 3: Handle local responses
            if (classification.needsLocal) {
                this.stats.localResponses++;
                return this.handleLocalResponse(classification, startTime);
            }
            
            // Step 4: Handle Puter.js responses
            return await this.handlePuterResponse(message, classification, startTime);
            
        } catch (error) {
            console.error('[Orchestrator] Error processing message:', error);
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }
    
    // ========== RESPONSE HANDLERS ==========
    
    /**
     * Handle local/built-in responses
     */
    handleLocalResponse(classification, startTime) {
        let response;
        
        switch (classification.category) {
            case 'greeting':
                response = this.classifier.getGreetingResponse();
                break;
                
            case 'math':
                response = `Hasil perhitungan: **${classification.localResult}**`;
                break;
                
            case 'time':
                response = classification.localResult;
                break;
                
            case 'faq':
                response = classification.localResult;
                break;
                
            default:
                response = this.classifier.getHelpResponse();
        }
        
        // Cache untuk pertanyaan serupa
        this.cache.set(classification.originalMessage, response, 'local', this.settings.cacheTTL);
        
        return {
            success: true,
            response: response,
            source: 'local',
            responseTime: Date.now() - startTime,
            category: classification.category,
            isCached: false
        };
    }
    
    /**
     * Handle Puter.js responses
     */
    async handlePuterResponse(message, classification, startTime) {
        // Queue management
        if (this.currentRequest) {
            return new Promise((resolve) => {
                this.messageQueue.push({ message, classification, startTime, resolve });
            });
        }
        
        this.currentRequest = true;
        
        try {
            // Load Puter.js jika perlu
            await this.puterLoader.load();
            
            // Chat dengan Puter
            const result = await this.puterLoader.chat(message);
            
            if (result.success) {
                this.stats.puterResponses++;
                
                // Cache response
                this.cache.set(message, result.response, 'puter', this.settings.cacheTTL);
                
                this.currentRequest = null;
                this.processQueue();
                
                return {
                    success: true,
                    response: result.response,
                    source: 'puter',
                    responseTime: Date.now() - startTime,
                    category: classification.category,
                    isCached: false
                };
            } else {
                throw new Error(result.error || 'Puter.js request failed');
            }
            
        } catch (error) {
            this.currentRequest = null;
            this.processQueue();
            
            // Fallback ke local response jika Puter gagal
            console.warn('[Orchestrator] Puter failed, using fallback');
            return this.handleFallback(message, classification, startTime, error);
        }
    }
    
    /**
     * Fallback handler when Puter.js fails
     */
    handleFallback(message, classification, startTime, error) {
        // Coba cek FAQ sebagai fallback
        const faqResponse = this.classifier.checkFAQ(message);
        
        if (faqResponse) {
            return {
                success: true,
                response: faqResponse,
                source: 'fallback (faq)',
                responseTime: Date.now() - startTime,
                category: classification.category,
                isCached: false,
                note: 'Puter.js unavailable, using local response'
            };
        }
        
        // General fallback
        return {
            success: false,
            error: error.message,
            response: 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti.',
            source: 'fallback',
            responseTime: Date.now() - startTime,
            category: classification.category
        };
    }
    
    // ========== QUEUE MANAGEMENT ==========
    
    processQueue() {
        while (this.messageQueue.length > 0 && !this.currentRequest) {
            const item = this.messageQueue.shift();
            this.processMessage(item.message).then(item.resolve);
        }
    }
    
    // ========== ML SERVICES ==========
    
    /**
     * Analyze image dengan TensorFlow/ML5
     */
    async analyzeImage(imageElement) {
        if (typeof tf === 'undefined') {
            return { error: 'TensorFlow.js not loaded' };
        }
        
        try {
            // Simple image classification
            if (typeof mobilenet !== 'undefined') {
                const model = await mobilenet.load();
                const predictions = await model.classify(imageElement);
                
                return {
                    success: true,
                    source: 'tensorflow-mobilenet',
                    predictions: predictions,
                    topPrediction: predictions[0]
                };
            }
            
            return { error: 'MobileNet model not available' };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    /**
     * Sentiment analysis dengan ML5
     */
    async analyzeSentiment(text) {
        // Simple keyword-based sentiment (tanpa perlu ML5 load)
        const positiveWords = ['senang', 'gembira', 'bahagia', 'cinta', 'suka', 'great', 'good', 'happy', 'love', 'excellent', 'amazing', 'awesome', 'best'];
        const negativeWords = ['sedih', 'marah', 'kecewa', 'benci', 'tidak suka', 'bad', 'sad', 'angry', 'hate', 'terrible', 'awful', 'worst', 'horrible'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.some(w => word.includes(w))) score++;
            if (negativeWords.some(w => word.includes(w))) score--;
        });
        
        let sentiment = 'neutral';
        if (score > 0) sentiment = 'positive';
        if (score < 0) sentiment = 'negative';
        
        return {
            success: true,
            source: 'local-sentiment',
            text: text,
            score: score,
            sentiment: sentiment,
            confidence: Math.min(Math.abs(score) / words.length * 5, 1)
        };
    }
    
    // ========== STATISTICS ==========
    
    getStats() {
        const total = this.stats.totalMessages;
        const uptime = Date.now() - this.stats.startTime;
        
        return {
            messages: {
                total: total,
                local: this.stats.localResponses,
                puter: this.stats.puterResponses,
                cacheHits: this.stats.cacheHits,
                cacheHitRate: total > 0 ? ((this.stats.cacheHits / total) * 100).toFixed(1) + '%' : '0%'
            },
            puterUsage: {
                count: this.stats.puterResponses,
                percent: total > 0 ? ((this.stats.puterResponses / total) * 100).toFixed(1) + '%' : '0%',
                limitSaved: this.stats.localResponses + this.stats.cacheHits
            },
            uptime: {
                total: Math.floor(uptime / 1000) + 's',
                since: new Date(this.stats.startTime).toLocaleString()
            },
            cache: this.cache.getStats()
        };
    }
    
    // ========== SETTINGS ==========
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('[Orchestrator] Settings updated:', this.settings);
    }
    
    clearCache() {
        this.cache.clear();
        console.log('[Orchestrator] Cache cleared');
    }
    
    resetStats() {
        this.stats = {
            totalMessages: 0,
            localResponses: 0,
            puterResponses: 0,
            cacheHits: 0,
            startTime: Date.now()
        };
        console.log('[Orchestrator] Stats reset');
    }
}

// Export
window.AmeliaOrchestrator = AmeliaOrchestrator;

