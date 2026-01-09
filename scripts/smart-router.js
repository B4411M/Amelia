/**
 * ============================================
 * AMELIA AI - SMART ROUTING SYSTEM
 * Intelligent question routing for optimal AI usage
 * ============================================
 */

class SmartQuestionClassifier {
    constructor() {
        // Patterns untuk mendeteksi jenis pertanyaan
        this.patterns = {
            // Greetings - response lokal
            greetings: {
                indonesian: /^(halo|hai|helo|hey|selamat|salam|sore|pagi|malam|siang|晚上的好|你好|嗨)/i,
                english: /^(hi|hello|hey|good morning|good afternoon|good evening|good night)/i
            },
            
            // Math sederhana - kalkulasi lokal
            simpleMath: /^[\d\s\+\-\*\/\%\.\,\(\)]+$/,
            
            // Waktu/Tanggal - response lokal
            timeQuery: /(jam|waktu|tanggal|hari|bulan|tahun|time|what time|date|what day|clock)/i,
            
            // Pertanyaan Ya/Tidak
            yesNoQuestion: /^(apa(kah)?|apakah|is|are|was|were|do|does|did|can|could|will|would|should|may|might|must|have|has|had)\s/i,
            
            // Pertanyaan sangat sederhana
            simpleQuestion: /^(siapa|apa|dimana|kapan|mengapa|bagaimana|who|what|where|when|why|how)\s/i,
            
            // Pertanyaan yang butuh AI complex
            complexQuestion: /(jelaskan|terangkan|analisis|bandingkan|evaluasi|rangkum|ringkas|bahas|tulis|buat|ciptakan|invent|explain|analyze|compare|evaluate|summarize|write|create|design|develop|build|code|program|debug|review|discuss|argumen|opinion|thoughts|views)/i,
            
            // Konten kreatif
            creativeContent: /(cerita|puisi|lagu|puisi|syair|novel|fiksi|cerita pendek|story|poem|song|lyrics|fiction|creative)/i,
            
            // Coding/Technical
            coding: /(code|kode|program|script|function|variable|api|database|server|frontend|backend|debug|error|bug|compile|deploy|github|git|terminal|command|linux|python|javascript|java|c\+\+|ruby|php|html|css|react|vue|angular|node|express|mongodb|sql)/i,
            
            // Informasi terkini
            currentInfo: /(berita|news|terkini|terbaru|hari ini|minggu ini|bulan ini|tahun ini|2024|2025|covid|pandemi|election|presiden|governmen)/i,
            
            // FAQ patterns
            faq: /(apa itu|definisi|meaning|definition|apa maksud|what is|means|definition of|bagaiamana cara|how to|tutorial|bisa|kakak|bro|gan)/i,
            
            // Personal questions
            personal: /(siapa kamu|who are you|what are you|kenalkan perkenalkan|describe yourself|tentang kamu|about you|your name|namamu)/i,
            
            // Sentiment/emotion
            sentiment: /(senang|sedih|marah|bahagia|kecewa|cinta|benci|marah|happy|sad|angry|love|hate|excited|bored|tired|feel|feeling)/i
        };
        
        // Database respons lokal
        this.localResponseDB = {
            greetings: {
                indonesian: [
                    "Halo! Ada yang bisa saya bantu hari ini?",
                    "Hai! Senang melihatmu. Ada pertanyaan apa?",
                    "Halo! Saya Amelia AI, asisten virtualmu. Apa kabar?",
                    "Hey! Siap membantu. Ada yang bisa kubantu?",
                    "Selamat datang! Ada yang bisa saya bantu?"
                ],
                english: [
                    "Hi! How can I help you today?",
                    "Hello! Great to see you. What brings you here?",
                    "Hey there! I'm Amelia AI. What's on your mind?",
                    "Hi there! Ready to help. What would you like to know?"
                ]
            },
            math: {
                '0+0': '0',
                '0+1': '1',
                '1+1': '2',
                '1+2': '3',
                '2+2': '4',
                '2+3': '5',
                '3+3': '6',
                '3+4': '7',
                '4+4': '8',
                '5+5': '10',
                '10-5': '5',
                '10-3': '7',
                '100/2': '50',
                '50*2': '100',
                '2*2': '4',
                '3*3': '9',
                '4*5': '20',
                '5*6': '30',
                '10*10': '100'
            },
            faq: {
                'apa itu ai': 'AI (Artificial Intelligence) adalah kecerdasan buatan yang memungkinkan komputer dan mesin berpikir seperti manusia. AI dapat belajar, memecahkan masalah, dan membuat keputusan.',
                'apa itu machine learning': 'Machine Learning adalah cabang AI yang memungkinkan sistem belajar dari data dan meningkatkan kinerja secara otomatis tanpa diprogram secara eksplisit.',
                'apa itu deep learning': 'Deep Learning adalah subset dari Machine Learning yang menggunakan neural network dengan banyak lapisan untuk mempelajari pola kompleks dalam data.',
                'siapa kamu': 'Saya Amelia AI, asisten virtual yang dibuat oleh B41M. Saya menggunakan teknologi AI terkini untuk membantu menjawab pertanyaan Anda.',
                'what is ai': 'AI (Artificial Intelligence) refers to the simulation of human intelligence in machines programmed to think and learn like humans.',
                'how to learn coding': 'Untuk belajar coding: 1) Pilih bahasa pemrograman (Python bagus untuk pemula), 2) Praktekkan setiap hari, 3) Buat proyek kecil, 4) Bergabung dengan komunitas, 5) Jangan takut membuat kesalahan.',
                'apa kabar': 'Saya baik! Terima kasih sudah bertanya. Saya siap membantu Anda dengan pertanyaan atau tugas apa pun. Bagaimana dengan Anda?'
            }
        };
    }
    
    /**
     * Klasifikasikan pertanyaan dan tentukan route yang tepat
     */
    classify(message) {
        const analysis = {
            originalMessage: message,
            cleanedMessage: message.trim().toLowerCase(),
            category: 'unknown',
            needsAI: false,
            needsML: false,
            needsLocal: false,
            confidence: 0,
            suggestedService: null
        };
        
        // Step 1: Cek greetings
        if (this.isGreeting(message)) {
            analysis.category = 'greeting';
            analysis.needsAI = false;
            analysis.needsLocal = true;
            analysis.confidence = 0.95;
            analysis.suggestedService = 'local';
            return analysis;
        }
        
        // Step 2: Cek matematika sederhana
        if (this.isSimpleMath(message)) {
            const mathResult = this.calculateMath(message);
            if (mathResult !== null) {
                analysis.category = 'math';
                analysis.needsAI = false;
                analysis.needsLocal = true;
                analysis.confidence = 0.9;
                analysis.suggestedService = 'local';
                analysis.localResult = mathResult;
                return analysis;
            }
        }
        
        // Step 3: Cek waktu/tanggal
        if (this.isTimeQuery(message)) {
            analysis.category = 'time';
            analysis.needsAI = false;
            analysis.needsLocal = true;
            analysis.confidence = 0.85;
            analysis.suggestedService = 'local';
            analysis.localResult = this.getTimeResponse(message);
            return analysis;
        }
        
        // Step 4: Cek FAQ database
        const faqResult = this.checkFAQ(message);
        if (faqResult) {
            analysis.category = 'faq';
            analysis.needsAI = false;
            analysis.needsLocal = true;
            analysis.confidence = 0.9;
            analysis.suggestedService = 'local';
            analysis.localResult = faqResult;
            return analysis;
        }
        
        // Step 5: Cek pertanyaan personal
        if (this.isPersonalQuestion(message)) {
            analysis.category = 'personal';
            analysis.needsAI = true;
            analysis.needsLocal = false;
            analysis.confidence = 0.75;
            analysis.suggestedService = 'puter';
            return analysis;
        }
        
        // Step 6: Cek pertanyaan coding/technical
        if (this.isCodingQuestion(message)) {
            analysis.category = 'coding';
            analysis.needsAI = true;
            analysis.needsLocal = false;
            analysis.confidence = 0.85;
            analysis.suggestedService = 'puter';
            return analysis;
        }
        
        // Step 7: Cek konten kreatif
        if (this.isCreativeContent(message)) {
            analysis.category = 'creative';
            analysis.needsAI = true;
            analysis.needsLocal = false;
            analysis.confidence = 0.85;
            analysis.suggestedService = 'puter';
            return analysis;
        }
        
        // Step 8: Cek pertanyaan simple yang butuh jawaban pendek
        if (this.isSimpleQuestion(message) && !this.isComplexQuestion(message)) {
            analysis.category = 'simple';
            analysis.needsAI = true;
            analysis.needsLocal = false;
            analysis.confidence = 0.6;
            analysis.suggestedService = 'puter';
            return analysis;
        }
        
        // Step 9: Cek pertanyaan yang butuh analisis mendalam
        if (this.isComplexQuestion(message)) {
            analysis.category = 'complex';
            analysis.needsAI = true;
            analysis.needsLocal = false;
            analysis.confidence = 0.8;
            analysis.suggestedService = 'puter';
            return analysis;
        }
        
        // Step 10: Cek informasi terkini
        if (this.isCurrentInfo(message)) {
            analysis.category = 'current';
            analysis.needsAI = true;
            analysis.needsLocal = false;
            analysis.confidence = 0.9;
            analysis.suggestedService = 'puter';
            return analysis;
        }
        
        // Default: butuh AI
        analysis.category = 'general';
        analysis.needsAI = true;
        analysis.needsLocal = false;
        analysis.confidence = 0.5;
        analysis.suggestedService = 'puter';
        
        return analysis;
    }
    
    // ========== DETECTION METHODS ==========
    
    isGreeting(message) {
        const cleaned = message.trim().toLowerCase();
        // Cek greetings Indonesian
        if (this.patterns.greetings.indonesian.test(cleaned)) {
            // Pastikan ini benar-benar sapaan, bukan bagian dari kalimat
            const greetingWords = ['halo', 'hai', 'helo', 'hey', 'salam', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam'];
            return greetingWords.some(g => cleaned === g || cleaned.startsWith(g + ' '));
        }
        // Cek greetings English
        if (this.patterns.greetings.english.test(cleaned)) {
            const engGreetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'good night'];
            return engGreetings.some(g => cleaned === g || cleaned.startsWith(g + ' '));
        }
        return false;
    }
    
    isSimpleMath(message) {
        // Hanya angka dan operator matematika
        const cleaned = message.trim();
        return this.patterns.simpleMath.test(cleaned) && 
               /[\d]/.test(cleaned) &&
               cleaned.length < 20; // Batasi kompleksitas
    }
    
    calculateMath(message) {
        try {
            const cleaned = message.replace(/[^\d\+\-\*\/\.\,\(\)\s]/g, '').trim();
            if (!cleaned) return null;
            
            // Safety:cek untuk mencegah code injection
            if (/[a-zA-Z]/.test(cleaned)) return null;
            
            // Evaluasi matematika
            const result = Function('"use strict"; return (' + cleaned + ')')();
            
            // Validasi hasil
            if (typeof result !== 'number' || !isFinite(result)) return null;
            
            // Format hasil
            return Number.isInteger(result) ? result.toString() : result.toFixed(2);
        } catch (e) {
            return null;
        }
    }
    
    isTimeQuery(message) {
        return this.patterns.timeQuery.test(message.trim().toLowerCase());
    }
    
    getTimeResponse(message) {
        const now = new Date();
        const cleaned = message.trim().toLowerCase();
        
        if (cleaned.includes('jam')) {
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `Sekarang jam ${displayHours}:${minutes} ${ampm} (Waktu lokal Anda)`;
        }
        
        if (cleaned.includes('tanggal') || cleaned.includes('hari')) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return `Hari ${now.toLocaleDateString('id-ID', options)}`;
        }
        
        if (cleaned.includes('bulan')) {
            return `Bulan ini adalah ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
        }
        
        if (cleaned.includes('tahun')) {
            return `Tahun ini adalah ${now.getFullYear()}`;
        }
        
        return `Waktu saat ini: ${now.toLocaleString('id-ID')}`;
    }
    
    isSimpleQuestion(message) {
        return this.patterns.simpleQuestion.test(message.trim().toLowerCase());
    }
    
    isComplexQuestion(message) {
        return this.patterns.complexQuestion.test(message.trim().toLowerCase());
    }
    
    isCodingQuestion(message) {
        return this.patterns.coding.test(message.trim().toLowerCase());
    }
    
    isCreativeContent(message) {
        return this.patterns.creativeContent.test(message.trim().toLowerCase());
    }
    
    isCurrentInfo(message) {
        return this.patterns.currentInfo.test(message.trim().toLowerCase());
    }
    
    isPersonalQuestion(message) {
        return this.patterns.personal.test(message.trim().toLowerCase());
    }
    
    isYesNoQuestion(message) {
        return this.patterns.yesNoQuestion.test(message.trim().toLowerCase());
    }
    
    checkFAQ(message) {
        const cleaned = message.trim().toLowerCase();
        
        // Exact match
        if (this.localResponseDB.faq[cleaned]) {
            return this.localResponseDB.faq[cleaned];
        }
        
        // Partial match
        for (const [key, value] of Object.entries(this.localResponseDB.faq)) {
            if (cleaned.includes(key) || key.includes(cleaned)) {
                return value;
            }
        }
        
        return null;
    }
    
    // ========== RESPONSE GENERATION ==========
    
    getGreetingResponse() {
        const responses = this.localResponseDB.greetings.indonesian;
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    getHelpResponse() {
        return `Halo! Saya Amelia AI. Saya bisa membantu Anda dengan:

📝 **Menjawab Pertanyaan**
- Informasi umum dan pengetahuan
- Penjelasan konsep dan definisi

💻 **Programming & Coding**
- Menulis dan menjelaskan kode
- Debugging dan optimisasi

🎨 **Konten Kreatif**
- Menulis cerita, puisi
- Ide dan Brainstorming

🖼️ **Analisis Gambar**
- Klasifikasi dan deteksi objek
- Analisis konten visual

📊 **Analisis & Research**
- Membandingkan topik
- Merangkum informasi

Apa yang ingin Anda tanya hari ini?`;
    }
    
    getErrorResponse() {
        return 'Maaf, saya tidak bisa memproses permintaan Anda saat ini. Bisa Anda coba dengan kata-kata yang berbeda?';
    }
    
    // ========== INDONESIAN LANGUAGE ENHANCEMENTS ==========
    
    /**
     * Enhanced Indonesian pattern detection
     */
    isIndonesianText(text) {
        const indonesianWords = [
            'saya', 'kamu', 'dia', 'kami', 'mereka', 'apa', 'siapa', 'dimana', 'kapan',
            'mengapa', 'bagaimana', 'bisa', 'tidak', 'ya', 'dan', 'atau', 'tapi',
            'karena', 'jika', 'lalu', 'kemudian', 'sekarang', 'besok', 'kemarin', 'hari',
            'minggu', 'bulan', 'tahun', 'waktu', 'jam', 'menit', 'detik', 'baik', 'buruk',
            'cantik', 'jelek', 'besar', 'kecil', 'panas', 'dingin', 'senang', 'sedih',
            'marah', 'takut', 'cinta', 'benci', 'makan', 'minum', 'tidur', 'bangun',
            'pergi', 'datang', 'lihat', 'dengar', 'bicara', 'tulis', 'baca', 'kerja',
            'belajar', 'main', 'jalan', 'lari', 'terbang', 'berenang', 'naik', 'turun'
        ];

        const words = text.toLowerCase().split(/\s+/);
        const indonesianWordCount = words.filter(word =>
            indonesianWords.some(indWord => word.includes(indWord))
        ).length;

        return indonesianWordCount / words.length > 0.3;
    }

    /**
     * Indonesian slang and colloquial handling
     */
    normalizeIndonesianSlang(text) {
        const slangMap = {
            'gw': 'saya', 'gue': 'saya', 'aku': 'saya', 'sy': 'saya',
            'lu': 'kamu', 'loe': 'kamu', 'elu': 'kamu',
            'kmrn': 'kemarin', 'kmaren': 'kemarin',
            'skrg': 'sekarang', 'skr': 'sekarang',
            'gak': 'tidak', 'nggak': 'tidak', 'ga': 'tidak', 'tdk': 'tidak',
            'bs': 'bisa',
            'mw': 'ingin', 'pingin': 'ingin',
            'banget': 'sekali', 'bgt': 'sekali', 'bt': 'sekali',
            'keren': 'bagus', 'mantap': 'bagus',
            'sip': 'ya', 'yoi': 'ya', 'yups': 'ya',
            'nih': '', 'dong': '',
            'gimana': 'bagaimana', 'gmn': 'bagaimana',
            'dimana': 'di mana', 'dmn': 'di mana',
            'kpn': 'kapan',
            'ngapa': 'mengapa', 'knp': 'mengapa',
            'kenapa': 'mengapa',
            'makasih': 'terima kasih', 'thanks': 'terima kasih',
            'plis': 'tolong',
            'hai': 'halo', 'hey': 'halo'
        };

        let normalized = text.toLowerCase();

        Object.entries(slangMap).forEach(([slang, formal]) => {
            const regex = new RegExp(`\\b${slang}\\b`, 'gi');
            normalized = normalized.replace(regex, formal);
        });

        return normalized.trim();
    }

    /**
     * Indonesian sentiment analysis
     */
    analyzeIndonesianSentiment(text) {
        const positiveWords = [
            'senang', 'bahagia', 'gembira', 'suka', 'cinta', 'bagus', 'baik', 'keren',
            'mantap', 'hebat', 'luar biasa', 'fantastis', 'menakjubkan', 'terbaik',
            'sempurna', 'indah', 'cantik', 'tampan', 'pintar', 'cerdas', 'pandai',
            'rajin', 'tekun', 'ulet', 'sabar', 'ramah', 'jujur',
            'alhamdullilah', 'masyaallah', 'subhanallah'
        ];

        const negativeWords = [
            'sedih', 'marah', 'kecewa', 'benci', 'dendam', 'buruk', 'jelek', 'parah',
            'hancur', 'rusak', 'mati', 'sakit', 'nyeri', 'susah', 'sulit',
            'bingung', 'takut', 'horor', 'menakutkan', 'jahat', 'dengki', 'iri',
            'bohong', 'malas', 'capek', 'lelah'
        ];

        const words = this.normalizeIndonesianSlang(text).split(/\s+/);
        let score = 0;
        let positiveCount = 0;
        let negativeCount = 0;

        words.forEach(word => {
            const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();

            if (positiveWords.some(pw => cleanWord.includes(pw))) {
                score += 1;
                positiveCount++;
            }
            if (negativeWords.some(nw => cleanWord.includes(nw))) {
                score -= 1;
                negativeCount++;
            }
        });

        let sentiment = 'neutral';
        if (score > 0.5) sentiment = 'positive';
        if (score < -0.5) sentiment = 'negative';

        return {
            score: score,
            sentiment: sentiment,
            confidence: Math.min(Math.abs(score) / Math.max(words.length, 1) * 3, 1),
            details: { positive: positiveCount, negative: negativeCount }
        };
    }

    /**
     * Indonesian FAQ responses
     */
    getIndonesianFAQResponse(query) {
        const faqMap = {
            'apa kabar': [
                'Saya baik-baik saja, terima kasih! Bagaimana dengan Anda?',
                'Alhamdullilah baik. Ada yang bisa saya bantu hari ini?'
            ],
            'siapa kamu': [
                'Saya Amelia AI, asisten virtual yang dibuat oleh B41M.',
                'Halo! Saya Amelia AI, asisten cerdas yang bisa membantu Anda.'
            ],
            'apa itu ai': [
                'AI atau Artificial Intelligence adalah kecerdasan buatan yang memungkinkan komputer berpikir dan belajar seperti manusia.'
            ],
            'apa yang bisa kamu lakukan': [
                'Saya bisa membantu Anda dengan berbagai hal: menjawab pertanyaan, memberikan informasi, dan membantu belajar!'
            ],
            'terima kasih': [
                'Sama-sama! Senang bisa membantu Anda.',
                'Tidak perlu berterima kasih. Saya di sini untuk membantu!'
            ]
        };

        const normalizedQuery = this.normalizeIndonesianSlang(query.toLowerCase());

        for (const [key, responses] of Object.entries(faqMap)) {
            if (normalizedQuery.includes(key)) {
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }

        return null;
    }

    /**
     * Indonesian greeting responses
     */
    getIndonesianGreetingResponse(timeBased = true) {
        const now = new Date();
        const hour = now.getHours();

        let timeGreeting = '';
        if (timeBased) {
            if (hour >= 5 && hour < 12) {
                timeGreeting = 'selamat pagi';
            } else if (hour >= 12 && hour < 15) {
                timeGreeting = 'selamat siang';
            } else if (hour >= 15 && hour < 18) {
                timeGreeting = 'selamat sore';
            } else {
                timeGreeting = 'selamat malam';
            }
        }

        const greetings = [
            `Halo! ${timeGreeting}! Ada yang bisa saya bantu hari ini?`,
            `${timeGreeting}! Senang bertemu dengan Anda.`,
            `Hai! ${timeGreeting}! Saya Amelia AI, siap membantu Anda.`
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }
}

// Export untuk penggunaan global
window.SmartQuestionClassifier = SmartQuestionClassifier;

