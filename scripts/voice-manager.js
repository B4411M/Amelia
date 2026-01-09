/**
 * ============================================
 * AMELIA AI - VOICE MANAGER
 * Voice Input/Output dengan Web Speech API
 * ============================================
 */

class VoiceManager {
    constructor() {
        // Speech Recognition (STT)
        this.recognition = null;
        this.isListening = false;
        this.continuousMode = false;
        this.voiceActivityDetection = true;

        // Speech Synthesis (TTS)
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isSpeaking = false;

        // Settings
        this.settings = {
            language: 'id-ID', // Indonesian primary
            continuous: false,
            interimResults: true,
            maxAlternatives: 1,
            voiceSpeed: 1.0,
            voicePitch: 1.0,
            voiceVolume: 1.0,
            autoStopTimeout: 3000, // Stop listening after 3s silence
            vadThreshold: 0.1 // Voice activity detection threshold
        };

        // State
        this.lastSpeechTime = 0;
        this.silenceTimeout = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;

        // Callbacks
        this.onSpeechResult = null;
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onError = null;
        this.onStatusChange = null;

        // Initialize
        this.init();
    }

    // ========== INITIALIZATION ==========

    async init() {
        console.log('[VoiceManager] Initializing...');

        // Check browser support
        if (!this.checkBrowserSupport()) {
            console.warn('[VoiceManager] Web Speech API not supported');
            this.updateStatus('unsupported');
            return false;
        }

        // Initialize Speech Recognition
        this.initSpeechRecognition();

        // Initialize Audio Context for VAD
        await this.initAudioContext();

        // Load saved settings
        this.loadSettings();

        this.updateStatus('ready');
        console.log('[VoiceManager] Ready!');
        return true;
    }

    checkBrowserSupport() {
        return ('webkitSpeechRecognition' in window ||
                'SpeechRecognition' in window) &&
               ('speechSynthesis' in window);
    }

    initSpeechRecognition() {
        // Create recognition instance
        const SpeechRecognition = window.SpeechRecognition ||
                                 window.webkitSpeechRecognition;

        this.recognition = new SpeechRecognition();

        // Configure recognition
        this.recognition.lang = this.settings.language;
        this.recognition.continuous = this.settings.continuous;
        this.recognition.interimResults = this.settings.interimResults;
        this.recognition.maxAlternatives = this.settings.maxAlternatives;

        // Event handlers
        this.recognition.onstart = () => this.handleSpeechStart();
        this.recognition.onresult = (event) => this.handleSpeechResult(event);
        this.recognition.onend = () => this.handleSpeechEnd();
        this.recognition.onerror = (event) => this.handleSpeechError(event);
        this.recognition.onnomatch = () => this.handleNoMatch();
    }

    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
        } catch (error) {
            console.warn('[VoiceManager] AudioContext not available:', error);
        }
    }

    // ========== SPEECH RECOGNITION (STT) ==========

    /**
     * Start listening for speech input
     */
    async startListening(options = {}) {
        if (this.isListening) {
            console.warn('[VoiceManager] Already listening');
            return false;
        }

        try {
            // Update settings if provided
            if (options.language) this.setLanguage(options.language);
            if (options.continuous !== undefined) this.setContinuous(options.continuous);

            // Start microphone access for VAD
            if (this.voiceActivityDetection) {
                await this.startMicrophone();
            }

            // Start recognition
            this.recognition.start();
            this.updateStatus('listening');

            console.log('[VoiceManager] Started listening');
            return true;

        } catch (error) {
            console.error('[VoiceManager] Failed to start listening:', error);
            this.handleError('start_failed', error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (!this.isListening) return;

        this.recognition.stop();
        this.stopMicrophone();
        this.clearSilenceTimeout();

        console.log('[VoiceManager] Stopped listening');
    }

    /**
     * Toggle continuous listening mode
     */
    toggleContinuous() {
        this.continuousMode = !this.continuousMode;
        this.setContinuous(this.continuousMode);
        return this.continuousMode;
    }

    /**
     * Set recognition language
     */
    setLanguage(lang) {
        this.settings.language = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
        this.saveSettings();
    }

    /**
     * Set continuous mode
     */
    setContinuous(continuous) {
        this.settings.continuous = continuous;
        if (this.recognition) {
            this.recognition.continuous = continuous;
        }
        this.saveSettings();
    }

    // ========== SPEECH SYNTHESIS (TTS) ==========

    /**
     * Speak text using TTS
     */
    async speak(text, options = {}) {
        if (!text || this.isSpeaking) return false;

        try {
            // Stop current speech
            this.stopSpeaking();

            // Create utterance
            const utterance = new SpeechSynthesisUtterance(text);

            // Configure voice settings
            utterance.lang = options.language || this.settings.language;
            utterance.rate = options.speed || this.settings.voiceSpeed;
            utterance.pitch = options.pitch || this.settings.voicePitch;
            utterance.volume = options.volume || this.settings.voiceVolume;

            // Set voice if specified
            if (options.voice) {
                utterance.voice = options.voice;
            } else {
                // Use Indonesian voice if available
                const indonesianVoice = this.getIndonesianVoice();
                if (indonesianVoice) {
                    utterance.voice = indonesianVoice;
                }
            }

            // Event handlers
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.currentUtterance = utterance;
                this.updateStatus('speaking');
                console.log('[VoiceManager] Started speaking');
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.updateStatus('ready');
                console.log('[VoiceManager] Finished speaking');
            };

            utterance.onerror = (event) => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.handleError('tts_error', event.error);
            };

            // Speak
            this.synthesis.speak(utterance);
            return true;

        } catch (error) {
            console.error('[VoiceManager] TTS error:', error);
            this.handleError('tts_failed', error);
            return false;
        }
    }

    /**
     * Stop current speech
     */
    stopSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
    }

    /**
     * Pause/resume speech
     */
    pauseSpeaking() {
        if (this.synthesis.speaking && !this.synthesis.paused) {
            this.synthesis.pause();
        }
    }

    resumeSpeaking() {
        if (this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    /**
     * Get available voices
     */
    getVoices() {
        return this.synthesis.getVoices();
    }

    /**
     * Get Indonesian voice if available
     */
    getIndonesianVoice() {
        const voices = this.getVoices();
        return voices.find(voice =>
            voice.lang.startsWith('id') ||
            voice.name.toLowerCase().includes('indonesia') ||
            voice.name.toLowerCase().includes('indonesian')
        );
    }

    /**
     * Set voice settings
     */
    setVoiceSettings(settings) {
        this.settings.voiceSpeed = settings.speed || this.settings.voiceSpeed;
        this.settings.voicePitch = settings.pitch || this.settings.voicePitch;
        this.settings.voiceVolume = settings.volume || this.settings.voiceVolume;
        this.saveSettings();
    }

    // ========== VOICE ACTIVITY DETECTION (VAD) ==========

    async startMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            // Start VAD monitoring
            this.monitorVoiceActivity();

        } catch (error) {
            console.warn('[VoiceManager] Microphone access failed:', error);
            this.voiceActivityDetection = false;
        }
    }

    stopMicrophone() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
    }

    monitorVoiceActivity() {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkActivity = () => {
            if (!this.isListening) return;

            this.analyser.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Check if voice activity detected
            if (average > this.settings.vadThreshold * 255) {
                this.lastSpeechTime = Date.now();
                this.clearSilenceTimeout();
            } else if (this.lastSpeechTime > 0) {
                // Start silence timeout
                this.startSilenceTimeout();
            }

            // Continue monitoring
            requestAnimationFrame(checkActivity);
        };

        checkActivity();
    }

    startSilenceTimeout() {
        if (this.silenceTimeout) return;

        this.silenceTimeout = setTimeout(() => {
            if (this.isListening && !this.settings.continuous) {
                console.log('[VoiceManager] Silence detected, stopping listening');
                this.stopListening();
            }
        }, this.settings.autoStopTimeout);
    }

    clearSilenceTimeout() {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }
    }

    // ========== EVENT HANDLERS ==========

    handleSpeechStart() {
        this.isListening = true;
        this.lastSpeechTime = Date.now();
        this.updateStatus('listening');

        if (this.onSpeechStart) {
            this.onSpeechStart();
        }

        console.log('[VoiceManager] Speech started');
    }

    handleSpeechResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];

        // Get transcript
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence || 0;

        // Check if final result
        const isFinal = lastResult.isFinal;

        if (this.onSpeechResult) {
            this.onSpeechResult({
                transcript: transcript,
                confidence: confidence,
                isFinal: isFinal,
                timestamp: Date.now()
            });
        }

        // Reset silence timeout on speech
        this.lastSpeechTime = Date.now();
        this.clearSilenceTimeout();

        console.log(`[VoiceManager] Speech result: "${transcript}" (${isFinal ? 'final' : 'interim'})`);
    }

    handleSpeechEnd() {
        this.isListening = false;
        this.stopMicrophone();
        this.clearSilenceTimeout();
        this.updateStatus('ready');

        if (this.onSpeechEnd) {
            this.onSpeechEnd();
        }

        console.log('[VoiceManager] Speech ended');
    }

    handleSpeechError(event) {
        console.error('[VoiceManager] Speech recognition error:', event.error);
        this.handleError(event.error, event);
    }

    handleNoMatch() {
        console.log('[VoiceManager] No speech match');
        if (this.onSpeechResult) {
            this.onSpeechResult({
                transcript: '',
                confidence: 0,
                isFinal: true,
                noMatch: true,
                timestamp: Date.now()
            });
        }
    }

    handleError(type, error) {
        this.updateStatus('error');

        if (this.onError) {
            this.onError({ type, error });
        }
    }

    // ========== UTILITY METHODS ==========

    updateStatus(status) {
        if (this.onStatusChange) {
            this.onStatusChange(status);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('amelia-voice-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('[VoiceManager] Failed to save settings:', e);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('amelia-voice-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('[VoiceManager] Failed to load settings:', e);
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            language: this.settings.language,
            continuous: this.settings.continuous,
            vadEnabled: this.voiceActivityDetection,
            browserSupport: this.checkBrowserSupport(),
            availableVoices: this.getVoices().length
        };
    }

    /**
     * Test voice features
     */
    async test() {
        console.log('[VoiceManager] Running tests...');

        // Test TTS
        await this.speak('Halo! Ini adalah tes suara Amelia AI.', { language: 'id-ID' });

        // Test STT (brief)
        setTimeout(() => {
            this.startListening({ continuous: false });
            setTimeout(() => this.stopListening(), 5000);
        }, 2000);

        return true;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        this.stopMicrophone();

        if (this.audioContext) {
            this.audioContext.close();
        }

        console.log('[VoiceManager] Destroyed');
    }
}

// Export
window.VoiceManager = VoiceManager;
