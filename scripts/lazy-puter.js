/**
 * ============================================
 * AMELIA AI - LAZY PUTER LOADER
 * Load Puter.js only when needed for optimal API usage
 * ============================================
 */

class LazyPuterLoader {
    constructor(options = {}) {
        this.puterScriptUrl = 'https://js.puter.com/v2/';
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        this.loadStartTime = null;
        
        // Configuration
        this.autoLoad = options.autoLoad || false;
        this.timeout = options.timeout || 30000; // 30 detik timeout
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 2000;
        
        // State management
        this.state = 'idle'; // idle, loading, ready, error
        this.error = null;
        this.usageCount = 0;
        
        // Callbacks
        this.onLoadCallbacks = [];
        this.onErrorCallbacks = [];
        
        // Initialize jika autoLoad enabled
        if (this.autoLoad) {
            this.load();
        }
    }
    
    // ========== CORE LOADING METHODS ==========
    
    /**
     * Load Puter.js script
     * @returns {Promise} - Resolves when loaded
     */
    load() {
        // Jika sudah loaded, return resolved promise
        if (this.isLoaded) {
            return Promise.resolve(this.getAI());
        }
        
        // Jika sedang loading, return existing promise
        if (this.isLoading) {
            return this.loadPromise;
        }
        
        // Mulai loading
        this.isLoading = true;
        this.loadStartTime = Date.now();
        this.state = 'loading';
        
        console.log('[PuterLoader] Starting to load Puter.js...');
        
        this.loadPromise = new Promise((resolve, reject) => {
            // Timeout handling
            const timeoutId = setTimeout(() => {
                if (!this.isLoaded) {
                    this.state = 'error';
                    this.error = new Error('Puter.js load timeout');
                    this.isLoading = false;
                    console.error('[PuterLoader] Load timeout after', this.timeout, 'ms');
                    reject(this.error);
                    this.triggerErrorCallbacks(this.error);
                }
            }, this.timeout);
            
            // Cek apakah script sudah ada di DOM
            const existingScript = document.querySelector(`script[src="${this.puterScriptUrl}"]`);
            if (existingScript) {
                this.handleScriptLoaded(resolve, reject, timeoutId);
                return;
            }
            
            // Load script baru
            this.injectScript(resolve, reject, timeoutId);
        });
        
        return this.loadPromise;
    }
    
    /**
     * Inject script tag ke DOM
     */
    injectScript(resolve, reject, timeoutId) {
        const script = document.createElement('script');
        script.src = this.puterScriptUrl;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            this.handleScriptLoaded(resolve, reject, timeoutId);
        };
        
        script.onerror = (error) => {
            this.handleLoadError(error, reject, timeoutId);
        };
        
        // Add to document
        document.head.appendChild(script);
        console.log('[PuterLoader] Script tag injected');
    }
    
    /**
     * Handle ketika script berhasil di-load
     */
    handleScriptLoaded(resolve, reject, timeoutId) {
        // Tunggu sebentar untuk inisialisasi Puter
        setTimeout(() => {
            clearTimeout(timeoutId);
            
            // Verify Puter is available
            if (typeof puter !== 'undefined' && puter.ai) {
                this.isLoaded = true;
                this.isLoading = false;
                this.state = 'ready';
                this.usageCount++;
                
                const loadTime = Date.now() - this.loadStartTime;
                console.log(`[PuterLoader] Loaded successfully in ${loadTime}ms`);
                
                resolve(this.getAI());
                this.triggerLoadCallbacks(this.getAI());
            } else {
                this.handleLoadError(new Error('Puter object not available after load'), reject, timeoutId);
            }
        }, 500); // Small delay untuk inisialisasi
    }
    
    /**
     * Handle load error
     */
    handleLoadError(error, reject, timeoutId) {
        clearTimeout(timeoutId);
        this.isLoading = false;
        this.state = 'error';
        this.error = error;
        
        console.error('[PuterLoader] Load failed:', error.message);
        
        // Retry logic
        if (this.retryAttempts > 0) {
            this.retryAttempts--;
            console.log(`[PuterLoader] Retrying... (${this.retryAttempts} attempts left)`);
            
            setTimeout(() => {
                this.load().then(resolve).catch(reject);
            }, this.retryDelay);
        } else {
            reject(error);
            this.triggerErrorCallbacks(error);
        }
    }
    
    // ========== USAGE METHODS ==========
    
    /**
     * Get Puter AI instance
     */
    getAI() {
        if (!this.isLoaded) {
            throw new Error('Puter.js not loaded. Call load() first.');
        }
        return puter.ai;
    }
    
    /**
     * Chat dengan Puter AI
     * @param {string} message - User message
     * @param {object} options - Additional options
     */
    async chat(message, options = {}) {
        const startTime = Date.now();
        
        try {
            // Load Puter.js jika belum loaded
            await this.load();
            
            // Enhance context dengan knowledge base
            const enhancedMessage = this.enhanceMessage(message);
            
            // Send to Puter AI
            const response = await puter.ai.chat(enhancedMessage);
            
            const responseTime = Date.now() - startTime;
            console.log(`[PuterLoader] Chat completed in ${responseTime}ms`);
            
            // Format response
            return {
                success: true,
                response: response.toString(),
                responseTime: responseTime,
                source: 'puter',
                message: message
            };
            
        } catch (error) {
            console.error('[PuterLoader] Chat error:', error);
            
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime,
                source: 'puter',
                message: message
            };
        }
    }
    
    /**
     * Enhance message dengan context dari knowledge base
     */
    enhanceMessage(message) {
        // Jika knowledge base tersedia, tambahkan context
        if (window.KNOWLEDGE_BASE) {
            const context = window.KNOWLEDGE_BASE.getEnhancedContext();
            return `${context}\n\nUser Question: "${message}"\n\nPlease respond naturally and helpfully.`;
        }
        return message;
    }
    
    // ========== STATE MANAGEMENT ==========
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            state: this.state,
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            usageCount: this.usageCount,
            error: this.error ? this.error.message : null,
            loadTime: this.loadStartTime ? Date.now() - this.loadStartTime : null
        };
    }
    
    /**
     * Check if Puter.js is available
     */
    isAvailable() {
        return this.isLoaded && typeof puter !== 'undefined' && puter.ai;
    }
    
    /**
     * Reset loader state
     */
    reset() {
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        this.state = 'idle';
        this.error = null;
        console.log('[PuterLoader] Reset complete');
    }
    
    // ========== CALLBACKS ==========
    
    /**
     * Register callback when loaded
     */
    onLoad(callback) {
        if (typeof callback === 'function') {
            if (this.isLoaded) {
                callback(this.getAI());
            } else {
                this.onLoadCallbacks.push(callback);
            }
        }
    }
    
    /**
     * Register callback when error
     */
    onError(callback) {
        if (typeof callback === 'function') {
            this.onErrorCallbacks.push(callback);
        }
    }
    
    /**
     * Trigger load callbacks
     */
    triggerLoadCallbacks(ai) {
        this.onLoadCallbacks.forEach(cb => {
            try {
                cb(ai);
            } catch (e) {
                console.error('[PuterLoader] Callback error:', e);
            }
        });
        this.onLoadCallbacks = [];
    }
    
    /**
     * Trigger error callbacks
     */
    triggerErrorCallbacks(error) {
        this.onErrorCallbacks.forEach(cb => {
            try {
                cb(error);
            } catch (e) {
                console.error('[PuterLoader] Error callback error:', e);
            }
        });
    }
    
    // ========== CONVENIENCE METHODS ==========
    
    /**
     * Quick chat - auto load jika perlu
     */
    static async quickChat(message, options = {}) {
        const loader = new LazyPuterLoader(options);
        return await loader.chat(message);
    }
    
    /**
     * Preload Puter.js di background
     */
    static preload() {
        const loader = new LazyPuterLoader({ autoLoad: true });
        return loader;
    }
}

// Export
window.LazyPuterLoader = LazyPuterLoader;

