/**
 * ============================================
 * AMELIA AI - SERVICE WORKER
 * Offline Support & Caching Strategies
 * ============================================
 */

const CACHE_NAME = 'amelia-ai-v2.1.0';
const STATIC_CACHE = 'amelia-static-v2.1.0';
const DYNAMIC_CACHE = 'amelia-dynamic-v2.1.0';
const API_CACHE = 'amelia-api-v2.1.0';
const VOICE_CACHE = 'amelia-voice-v2.1.0';

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/main.css',
    '/styles/voice.css',
    '/scripts/voice-manager.js',
    '/scripts/smart-router.js',
    '/scripts/cache-manager.js',
    '/scripts/orchestrator.js'
];

// External assets with versioned URLs
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.gstatic.com',
    'https://js.puter.com/v2/',
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest/dist/mobilenet.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@latest/dist/coco-ssd.min.js',
    'https://unpkg.com/ml5@latest/dist/ml5.min.js',
    'https://unpkg.com/brain.js',
    'https://cdn.jsdelivr.net/npm/langchain/langchain.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Cache install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name.startsWith('amelia-') && 
                                   name !== STATIC_CACHE &&
                                   name !== DYNAMIC_CACHE &&
                                   name !== API_CACHE &&
                                   name !== VOICE_CACHE;
                        })
                        .map((name) => {
                            console.log('[ServiceWorker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Determine caching strategy based on request type
    if (isExternalAPI(url)) {
        // External API - Network first with cache fallback
        event.respondWith(networkFirstWithCacheFallback(API_CACHE, request));
    } else if (isVoiceAsset(url)) {
        // Voice-related assets - Cache first
        event.respondWith(cacheFirst(STATIC_CACHE, request));
    } else if (isStaticAsset(url)) {
        // Static assets - Cache first with network update
        event.respondWith(staleWhileRevalidate(STATIC_CACHE, request));
    } else if (isApiRequest(url)) {
        // API requests - Network only, no caching
        event.respondWith(networkOnly(request));
    } else {
        // Default - Stale while revalidate
        event.respondWith(staleWhileRevalidate(DYNAMIC_CACHE, request));
    }
});

// ========== CACHING STRATEGIES ==========

/**
 * Cache First - Try cache, fall back to network
 */
async function cacheFirst(cacheName, request) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        console.log('[ServiceWorker] Cache hit:', request.url);
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network First - Try network, fall back to cache
 */
async function networkFirstWithCacheFallback(cacheName, request) {
    const cache = await caches.open(cacheName);
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Network failed, trying cache:', request.url);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page or error response
        return new Response(JSON.stringify({ 
            error: 'Offline', 
            message: ' Anda sedang offline. Silakan coba lagi nanti.' 
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale While Revalidate - Return cache immediately, update in background
 */
async function staleWhileRevalidate(cacheName, request) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('[ServiceWorker] Network fetch failed:', error.message);
            return cachedResponse || new Response('Offline', { status: 503 });
        });
    
    return cachedResponse || fetchPromise;
}

/**
 * Network Only - Always fetch from network
 */
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ========== HELPERS ==========

function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
           url.pathname === '/' ||
           url.pathname === '/index.html';
}

function isExternalAPI(url) {
    const externalDomains = ['js.puter.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.googleapis.com'];
    return externalDomains.some(domain => url.hostname.includes(domain));
}

function isVoiceAsset(url) {
    return url.hostname.includes('googleapis.com') ||
           url.hostname.includes('gstatic.com');
}

function isApiRequest(url) {
    return url.pathname.includes('/api/') ||
           url.search.includes('api=');
}

// ========== BACKGROUND SYNC ==========

self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    // Get pending messages from IndexedDB
    // This would integrate with the main app
    console.log('[ServiceWorker] Syncing messages...');
}

// ========== PUSH NOTIFICATIONS ==========

self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');
    
    let data = { title: 'Amelia AI', body: 'Pesan baru', icon: '/icons/icon-192.png' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Buka' },
            { action: 'close', title: 'Tutup' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// ========== MESSAGE HANDLING ==========

self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
    
    if (event.data.type === 'GET_CACHE_STATUS') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                const status = {};
                return Promise.all(
                    cacheNames.map(async (name) => {
                        const cache = await caches.open(name);
                        const keys = await cache.keys();
                        status[name] = keys.length;
                    })
                ).then(() => {
                    event.ports[0].postMessage({ status });
                });
            })
        );
    }
});

console.log('[ServiceWorker] Loaded successfully');

