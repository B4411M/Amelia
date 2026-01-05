/**
 * ============================================
 * AMELIA AI - CACHE MANAGER
 * Smart caching system untuk mengurangi API calls
 * ============================================
 */

class ResponseCacheManager {
    constructor(options = {}) {
        this.cacheName = 'ameliaAI-cache';
        this.defaultTTL = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik
        this.maxCacheSize = 500; // Max jumlah entry
        this.storageKey = 'amelia_cache_v1';
        
        // Initialize cache dari localStorage
        this.cache = this.loadCache();
        
        // Statistik cache
        this.stats = {
            hits: 0,
            misses: 0,
            size: this.cache.size
        };
    }
    
    // ========== CORE METHODS ==========
    
    /**
     * Load cache dari localStorage
     */
    loadCache() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                // Filter entries yang sudah expired
                const now = Date.now();
                const validEntries = new Map();
                
                for (const [key, value] of Object.entries(data)) {
                    if (value.expiresAt > now) {
                        validEntries.set(key, value);
                    }
                }
                
                console.log(`[Cache] Loaded ${validEntries.size} valid entries from storage`);
                return validEntries;
            }
        } catch (e) {
            console.warn('[Cache] Failed to load cache:', e);
        }
        return new Map();
    }
    
    /**
     * Simpan cache ke localStorage
     */
    saveCache() {
        try {
            const data = {};
            this.cache.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('[Cache] Failed to save cache:', e);
            // Jika storage penuh, hapus entry terlama
            if (e.name === 'QuotaExceededError') {
                this.evictOldest(50);
                this.saveCache();
            }
        }
    }
    
    /**
     * Generate cache key dari message
     */
    generateKey(message) {
        // Normalize message untuk consistent caching
        const normalized = message
            .trim()
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Hapus special chars
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
        
        // Hash function sederhana
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `msg_${Math.abs(hash).toString(16)}`;
    }
    
    // ========== CACHE OPERATIONS ==========
    
    /**
     * Get cached response
     * @param {string} message - User message
     * @returns {object|null} - Cached response atau null
     */
    get(message) {
        const key = this.generateKey(message);
        
        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            
            // Cek apakah sudah expired
            if (entry.expiresAt > Date.now()) {
                this.stats.hits++;
                console.log(`[Cache] HIT: "${message.substring(0, 30)}..."`);
                return {
                    data: entry.data,
                    source: entry.source,
                    cachedAt: entry.cachedAt,
                    isCached: true,
                    age: Date.now() - entry.cachedAt
                };
            } else {
                // Entry expired, hapus
                this.cache.delete(key);
            }
        }
        
        this.stats.misses++;
        console.log(`[Cache] MISS: "${message.substring(0, 30)}..."`);
        return null;
    }
    
    /**
     * Simpan response ke cache
     * @param {string} message - User message
     * @param {string} data - AI response
     * @param {string} source - Source service (puter, local, etc)
     * @param {number} ttl - Time to live dalam ms (optional)
     */
    set(message, data, source = 'puter', ttl = null) {
        const key = this.generateKey(message);
        const now = Date.now();
        
        // Jika cache sudah penuh, evict entry terlama
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest(50);
        }
        
        const entry = {
            data: data,
            source: source,
            cachedAt: now,
            expiresAt: now + (ttl || this.defaultTTL),
            messageHash: this.hashMessage(message)
        };
        
        this.cache.set(key, entry);
        this.stats.size = this.cache.size;
        
        console.log(`[Cache] SET: "${message.substring(0, 30)}..." (source: ${source})`);
        
        // Simpan ke localStorage
        this.saveCache();
        
        return entry;
    }
    
    /**
     * Hapus entry berdasarkan message
     */
    delete(message) {
        const key = this.generateKey(message);
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.saveCache();
            this.stats.size = this.cache.size;
        }
        return deleted;
    }
    
    /**
     * Clear semua cache
     */
    clear() {
        this.cache.clear();
        localStorage.removeItem(this.storageKey);
        this.stats = { hits: 0, misses: 0, size: 0 };
        console.log('[Cache] Cache cleared');
    }
    
    /**
     * Evict entry terlama
     * @param {number} count - Jumlah entry yang dihapus
     */
    evictOldest(count = 10) {
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
        
        const toRemove = entries.slice(0, Math.min(count, entries.length));
        toRemove.forEach(([key]) => {
            this.cache.delete(key);
        });
        
        console.log(`[Cache] Evicted ${toRemove.length} oldest entries`);
        this.stats.size = this.cache.size;
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Hash message untuk referensi
     */
    hashMessage(message) {
        let hash = 0;
        for (let i = 0; i < message.length; i++) {
            const char = message.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : 0;
        
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            total: total,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            storageUsed: this.getStorageUsage()
        };
    }
    
    /**
     * Hitung storage yang digunakan
     */
    getStorageUsage() {
        try {
            let total = 0;
            for (const [key, value] of this.cache) {
                total += key.length + JSON.stringify(value).length;
            }
            // localStorage limit ~5MB
            return {
                used: `${(total / 1024).toFixed(1)} KB`,
                percent: `${((total / (5 * 1024 * 1024)) * 100).toFixed(2)}%`
            };
        } catch (e) {
            return { used: 'Unknown', percent: 'Unknown' };
        }
    }
    
    /**
     * Get semua cached entries (untuk debugging)
     */
    getAllEntries() {
        return Array.from(this.cache.entries()).map(([key, value]) => ({
            key: key,
            messagePreview: value.messageHash,
            source: value.source,
            cachedAt: new Date(value.cachedAt).toLocaleString(),
            expiresAt: new Date(value.expiresAt).toLocaleString(),
            isExpired: value.expiresAt < Date.now()
        }));
    }
    
    /**
     * Clean expired entries
     */
    cleanExpired() {
        let cleaned = 0;
        const now = Date.now();
        
        for (const [key, value] of this.cache) {
            if (value.expiresAt <= now) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.saveCache();
            this.stats.size = this.cache.size;
            console.log(`[Cache] Cleaned ${cleaned} expired entries`);
        }
        
        return cleaned;
    }
}

// Export
window.ResponseCacheManager = ResponseCacheManager;

