/**
 * ============================================
 * AMELIA AI - INDEXEDDB MANAGER
 * Offline Storage untuk Chat, Images, dan ML Data
 * ============================================
 */

class IndexedDBManager {
    constructor() {
        this.dbName = 'AmeliaAI_DB';
        this.dbVersion = 1;
        this.db = null;
        
        // Store names
        this.STORES = {
            CHAT_HISTORY: 'chatHistory',
            MESSAGES: 'messages',
            IMAGES: 'images',
            CACHE: 'cache',
            SETTINGS: 'settings',
            MODELS: 'models',
            FILES: 'files'
        };
    }

    async init() {
        console.log('[IndexedDB] Initializing...');
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('[IndexedDB] Failed to open:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('[IndexedDB] Connected successfully');
                resolve(this);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('[IndexedDB] Upgrading database...');
                const db = event.target.result;
                
                // Chat History Store
                if (!db.objectStoreNames.contains(this.STORES.CHAT_HISTORY)) {
                    const chatStore = db.createObjectStore(this.STORES.CHAT_HISTORY, { keyPath: 'id', autoIncrement: true });
                    chatStore.createIndex('timestamp', 'timestamp', { unique: false });
                    chatStore.createIndex('title', 'title', { unique: false });
                }
                
                // Messages Store
                if (!db.objectStoreNames.contains(this.STORES.MESSAGES)) {
                    const msgStore = db.createObjectStore(this.STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
                    msgStore.createIndex('chatId', 'chatId', { unique: false });
                    msgStore.createIndex('timestamp', 'timestamp', { unique: false });
                    msgStore.createIndex('sender', 'sender', { unique: false });
                }
                
                // Images Store (for caching uploaded images)
                if (!db.objectStoreNames.contains(this.STORES.IMAGES)) {
                    const imgStore = db.createObjectStore(this.STORES.IMAGES, { keyPath: 'id', autoIncrement: true });
                    imgStore.createIndex('blob', 'blob', { unique: false });
                    imgStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Cache Store
                if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
                    const cacheStore = db.createObjectStore(this.STORES.CACHE, { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                    cacheStore.createIndex('expiry', 'expiry', { unique: false });
                }
                
                // Settings Store
                if (!db.objectStoreNames.contains(this.STORES.SETTINGS)) {
                    db.createObjectStore(this.STORES.SETTINGS, { keyPath: 'key' });
                }
                
                // Models Store (for ML models)
                if (!db.objectStoreNames.contains(this.STORES.MODELS)) {
                    const modelStore = db.createObjectStore(this.STORES.MODELS, { keyPath: 'id', autoIncrement: true });
                    modelStore.createIndex('name', 'name', { unique: false });
                    modelStore.createIndex('type', 'type', { unique: false });
                }
                
                // Files Store
                if (!db.objectStoreNames.contains(this.STORES.FILES)) {
                    const fileStore = db.createObjectStore(this.STORES.FILES, { keyPath: 'id', autoIncrement: true });
                    fileStore.createIndex('name', 'name', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // ========== CHAT HISTORY OPERATIONS ==========

    async createChat(title = 'Percakapan Baru') {
        const chat = {
            title,
            timestamp: Date.now(),
            lastMessage: null,
            messageCount: 0
        };
        
        return this.add(this.STORES.CHAT_HISTORY, chat);
    }

    async getChat(chatId) {
        return this.get(this.STORES.CHAT_HISTORY, chatId);
    }

    async getAllChats() {
        return this.getAll(this.STORES.CHAT_HISTORY, 'timestamp');
    }

    async updateChat(chatId, updates) {
        const chat = await this.get(this.STORES.CHAT_HISTORY, chatId);
        if (chat) {
            return this.put(this.STORES.CHAT_HISTORY, { ...chat, ...updates });
        }
        return null;
    }

    async deleteChat(chatId) {
        // Delete chat and all its messages
        await this.delete(this.STORES.CHAT_HISTORY, chatId);
        
        // Delete all messages in this chat
        const messages = await this.getMessagesByChatId(chatId);
        for (const msg of messages) {
            await this.delete(this.STORES.MESSAGES, msg.id);
        }
    }

    // ========== MESSAGE OPERATIONS ==========

    async addMessage(chatId, content, sender = 'user') {
        const message = {
            chatId,
            content,
            sender,
            timestamp: Date.now(),
            attachments: [],
            metadata: {}
        };
        
        const msgId = await this.add(this.STORES.MESSAGES, message);
        
        // Update chat last message and count
        await this.updateChat(chatId, {
            lastMessage: content.substring(0, 50),
            messageCount: (await this.getMessagesByChatId(chatId)).length + 1,
            timestamp: Date.now()
        });
        
        return msgId;
    }

    async getMessagesByChatId(chatId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.MESSAGES], 'readonly');
            const store = transaction.objectStore(this.STORES.MESSAGES);
            const index = store.index('chatId');
            const request = index.getAll(chatId);
            
            request.onsuccess = () => {
                resolve(request.result.sort((a, b) => a.timestamp - b.timestamp));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMessagesByChatId(chatId) {
        const messages = await this.getMessagesByChatId(chatId);
        for (const msg of messages) {
            await this.delete(this.STORES.MESSAGES, msg.id);
        }
    }

    // ========== IMAGE OPERATIONS ==========

    async cacheImage(blob, metadata = {}) {
        const imageData = {
            blob,
            metadata,
            timestamp: Date.now(),
            size: blob.size,
            type: blob.type
        };
        
        return this.add(this.STORES.IMAGES, imageData);
    }

    async getCachedImages() {
        return this.getAll(this.STORES.IMAGES, 'timestamp');
    }

    async deleteCachedImage(id) {
        return this.delete(this.STORES.IMAGES, id);
    }

    async clearOldImages(olderThan = 7 * 24 * 60 * 60 * 1000) { // 7 days
        const cutoff = Date.now() - olderThan;
        const images = await this.getAll(this.STORES.IMAGES, 'timestamp');
        
        for (const img of images) {
            if (img.timestamp < cutoff) {
                await this.delete(this.STORES.IMAGES, img.id);
            }
        }
    }

    // ========== CACHE OPERATIONS ==========

    async setCache(key, data, expiry = 24 * 60 * 60 * 1000) {
        const cacheData = {
            key,
            data,
            timestamp: Date.now(),
            expiry: Date.now() + expiry
        };
        
        return this.put(this.STORES.CACHE, cacheData);
    }

    async getCache(key) {
        const cacheData = await this.get(this.STORES.CACHE, key);
        
        if (!cacheData) return null;
        
        // Check if expired
        if (Date.now() > cacheData.expiry) {
            await this.delete(this.STORES.CACHE, key);
            return null;
        }
        
        return cacheData.data;
    }

    async deleteCache(key) {
        return this.delete(this.STORES.CACHE, key);
    }

    async clearExpiredCache() {
        const now = Date.now();
        const cacheEntries = await this.getAll(this.STORES.CACHE, 'timestamp');
        
        for (const entry of cacheEntries) {
            if (now > entry.expiry) {
                await this.delete(this.STORES.CACHE, entry.key);
            }
        }
    }

    // ========== SETTINGS OPERATIONS ==========

    async setSetting(key, value) {
        return this.put(this.STORES.SETTINGS, { key, value });
    }

    async getSetting(key) {
        const result = await this.get(this.STORES.SETTINGS, key);
        return result ? result.value : null;
    }

    async getAllSettings() {
        const results = await this.getAll(this.STORES.SETTINGS);
        const settings = {};
        results.forEach(r => {
            settings[r.key] = r.value;
        });
        return settings;
    }

    // ========== MODEL OPERATIONS ==========

    async saveModel(name, type, data) {
        const model = {
            name,
            type,
            data,
            timestamp: Date.now()
        };
        
        return this.add(this.STORES.MODELS, model);
    }

    async getModelsByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.MODELS], 'readonly');
            const store = transaction.objectStore(this.STORES.MODELS);
            const index = store.index('type');
            const request = index.getAll(type);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ========== GENERIC OPERATIONS ==========

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = indexName ? store.index(indexName).getAll() : store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ========== UTILITY METHODS ==========

    async getStorageUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage,
                quota: estimate.quota,
                percent: ((estimate.usage / estimate.quota) * 100).toFixed(2) + '%'
            };
        }
        return { used: 0, quota: 0, percent: 'Unknown' };
    }

    async getStats() {
        const stats = {};
        
        for (const [name, storeName] of Object.entries(this.STORES)) {
            const count = await this.getAll(storeName);
            stats[name.toLowerCase()] = count.length;
        }
        
        const storage = await this.getStorageUsage();
        stats.storage = storage;
        
        return stats;
    }

    async exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: this.dbVersion,
            stores: {}
        };
        
        for (const [name, storeName] of Object.entries(this.STORES)) {
            data.stores[name] = await this.getAll(storeName);
        }
        
        return data;
    }

    async importData(data) {
        if (data.version !== this.dbVersion) {
            console.warn('[IndexedDB] Version mismatch, some data may not be compatible');
        }
        
        for (const [name, items] of Object.entries(data.stores)) {
            const storeName = this.STORES[name];
            if (storeName) {
                for (const item of items) {
                    await this.put(storeName, item);
                }
            }
        }
    }

    async clearAll() {
        for (const storeName of Object.values(this.STORES)) {
            await this.clear(storeName);
        }
        console.log('[IndexedDB] All stores cleared');
    }
}

// Export
window.IndexedDBManager = IndexedDBManager;

