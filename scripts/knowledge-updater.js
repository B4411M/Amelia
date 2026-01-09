/**
 * ============================================
 * AMELIA AI - REAL-TIME KNOWLEDGE UPDATE SYSTEM
 * Selalu update pengetahuan AI dengan informasi terkini
 * ============================================
 */

class KnowledgeUpdater {
    constructor() {
        this.isUpdating = false;
        this.lastUpdate = null;
        this.updateInterval = 5 * 60 * 1000; // 5 minutes (lebih sering!)
        this.cachedData = {};
        this.updateOnEveryQuery = true; // Update setiap ada query
        this.continuousMode = true; // Mode update terus-menerus
        
        // Knowledge sources
        this.sources = {
            news: {
                url: 'https://api.allorigins.win/raw?url=https://news.google.com/rss',
                parser: this.parseNewsRSS.bind(this)
            },
            wikipedia: {
                url: 'https://api.allorigins.win/raw?url=https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=15&format=json&origin=*',
                parser: this.parseWikipedia.bind(this)
            },
            time: {
                url: null,
                parser: this.getTimeData.bind(this)
            },
            trends: {
                url: 'https://api.allorigins.win/raw?url=https://trends.google.com/trends/api/dailytrends?hl=id&cat=all',
                parser: this.parseTrends.bind(this)
            }
        };
    }

    // Initialize knowledge update system
    async init() {
        console.log('🔄 Knowledge Updater: Starting...');
        console.log('📡 Mode: Continuous Update (Setiap 5 menit)');
        
        // Initial update
        await this.performUpdate();
        
        // Periodic updates - lebih sering!
        setInterval(() => {
            this.performUpdate();
        }, this.updateInterval);
        
        // Background continuous update ( setiap 1 menit )
        setInterval(() => {
            this.quickUpdate();
        }, 60 * 1000);
        
        // Listen untuk user queries
        this.setupQueryListener();
        
        console.log('✅ Knowledge Updater ready! (Continuous Mode)');
        return true;
    }

    // Setup listener untuk setiap user query
    setupQueryListener() {
        document.addEventListener('message-sent', async (e) => {
            if (this.updateOnEveryQuery) {
                // Update ringan saat ada pesan
                await this.quickUpdate();
            }
        });
    }

    // Quick update (hanya waktu dan data ringan)
    async quickUpdate() {
        try {
            // Update waktu
            this.cachedData.time = this.getTimeData();
            this.lastUpdate = new Date();
            
            // Trigger update event
            window.dispatchEvent(new CustomEvent('knowledge-updated', {
                detail: { timestamp: this.lastUpdate }
            }));
            
        } catch (error) {
            console.warn('Quick update failed:', error.message);
        }
    }

    // Perform full knowledge update from all sources
    async performUpdate() {
        if (this.isUpdating) {
            console.log('⏳ Update already in progress...');
            return this.cachedData;
        }

        this.isUpdating = true;
        console.log('🔄 Updating knowledge...');

        try {
            // Update from all sources in parallel
            const [news, wiki, time] = await Promise.all([
                this.updateFromNews(),
                this.updateFromWikipedia(),
                this.updateTimeData()
            ]);

            this.cachedData = {
                news,
                wiki,
                time,
                timestamp: new Date().toISOString()
            };

            this.lastUpdate = new Date();
            console.log('✅ Knowledge updated successfully!');
            console.log('📅 Last update:', this.lastUpdate.toLocaleString());

            return this.cachedData;

        } catch (error) {
            console.error('❌ Update failed:', error);
            return this.cachedData;
        } finally {
            this.isUpdating = false;
        }
    }

    // Get news from RSS feed
    async updateFromNews() {
        try {
            const response = await fetch(this.sources.news.url);
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            
            const items = xml.querySelectorAll('item');
            const news = [];
            
            items.slice(0, 10).forEach(item => {
                news.push({
                    title: item.querySelector('title')?.textContent || '',
                    link: item.querySelector('link')?.textContent || '',
                    description: item.querySelector('description')?.textContent?.substring(0, 200) + '...' || '',
                    pubDate: item.querySelector('pubDate')?.textContent || ''
                });
            });
            
            return news;
        } catch (error) {
            console.warn('⚠️ News update failed:', error.message);
            return [];
        }
    }

    // Get trending topics from Wikipedia
    async updateFromWikipedia() {
        try {
            const response = await fetch(this.sources.wikipedia.url);
            const data = await response.json();
            
            const searches = data.query.search;
            const topics = searches.map(snippet => ({
                title: snippet.title,
                snippet: snippet.snippet.substring(0, 300),
                timestamp: snippet.timestamp
            }));
            
            return topics;
        } catch (error) {
            console.warn('⚠️ Wikipedia update failed:', error.message);
            return [];
        }
    }

    // Get current time data
    getTimeData() {
        const now = new Date();
        return {
            date: now.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            time: now.toLocaleTimeString('id-ID'),
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Parse trends data
    parseTrends(xmlText) {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            const trends = [];
            
            const entries = xml.querySelectorAll('entry');
            entries.slice(0, 10).forEach(entry => {
                trends.push({
                    title: entry.querySelector('title')?.textContent || '',
                    traffic: entry.querySelector(' traffics')?.textContent || ''
                });
            });
            
            return trends;
        } catch (error) {
            console.warn('Trends parsing failed:', error.message);
            return [];
        }
    }

    // Parse news RSS
    parseNewsRSS(xmlText) {
        // Already parsed in updateFromNews
        return [];
    }

    // Parse Wikipedia response
    parseWikipedia(jsonData) {
        // Already parsed in updateFromWikipedia
        return [];
    }

    // Build enhanced context for AI
    getEnhancedContext() {
        const data = this.cachedData;
        
        let context = `📅 TANGGAL & WAKTU SAAT INI:
${data.time?.date || 'Tidak tersedia'}
Jam: ${data.time?.time || 'Tidak tersedia'}
Zona Waktu: ${data.time?.timezone || 'Tidak diketahui'}

`;

        if (data.wiki && data.wiki.length > 0) {
            context += `📚 TOPIK TRENDING SAAT INI (Wikipedia):\n`;
            data.wiki.forEach((item, i) => {
                context += `${i + 1}. ${item.title}\n   ${item.snippet}\n\n`;
            });
        }

        if (data.news && data.news.length > 0) {
            context += `📰 BERITA TERKINI:\n`;
            data.news.slice(0, 5).forEach((item, i) => {
                context += `${i + 1}. ${item.title}\n   ${item.link}\n\n`;
            });
        }

        context += `===============================================
Instruksi untuk Amelia AI:
- Gunakan informasi terkini dari data di atas
- Jika ditanya tentang berita atau peristiwa terkini, gunakan data di atas
- Selalu berikan konteks waktu yang relevan
- Jika informasi tidak tersedia di data di atas, katakan dengan jujur
===============================================`;

        return context;
    }

    // Search knowledge base
    search(query) {
        const results = [];
        
        // Search in news
        if (this.cachedData.news) {
            this.cachedData.news.forEach(item => {
                if (item.title.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ type: 'news', ...item });
                }
            });
        }

        // Search in wiki
        if (this.cachedData.wiki) {
            this.cachedData.wiki.forEach(item => {
                if (item.title.toLowerCase().includes(query.toLowerCase()) ||
                    item.snippet.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ type: 'wiki', ...item });
                }
            });
        }

        return results;
    }

    // Force update now
    async forceUpdate() {
        return await this.performUpdate();
    }

    // Get update status
    getStatus() {
        return {
            isUpdating: this.isUpdating,
            lastUpdate: this.lastUpdate,
            nextUpdate: this.lastUpdate ? new Date(this.lastUpdate.getTime() + this.updateInterval) : null,
            dataCount: {
                news: this.cachedData.news?.length || 0,
                wiki: this.cachedData.wiki?.length || 0
            }
        };
    }
}

// Create global instance
window.knowledgeUpdater = new KnowledgeUpdater();

// Quick access functions
window.updateKnowledge = async () => {
    return await window.knowledgeUpdater?.forceUpdate();
};

window.getKnowledgeContext = () => {
    return window.knowledgeUpdater?.getEnhancedContext() || '';
};

window.searchKnowledge = (query) => {
    return window.knowledgeUpdater?.search(query) || [];
};

window.getKnowledgeStatus = () => {
    return window.knowledgeUpdater?.getStatus() || {};
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await window.knowledgeUpdater?.init();
});

console.log('✅ Knowledge Updater loaded!');

