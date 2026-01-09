/**
 * ============================================
 * AMELIA AI - NEURAL NETWORK TRAINER
 * Advanced ML Training Interface
 * ============================================
 */

class NeuralNetworkTrainer {
    constructor() {
        this.network = null;
        this.isTraining = false;
        this.trainingData = [];
        this.model = null;
        this.stats = {
            iterations: 0,
            error: 1,
            time: 0
        };
        
        // Training settings
        this.settings = {
            iterations: 1000,
            errorThresh: 0.005,
            learningRate: 0.3,
            hiddenLayers: [10],
            activation: 'sigmoid'
        };
    }

    // ========== INITIALIZATION ==========

    async init() {
        console.log('[NeuralTrainer] Initializing...');
        
        if (typeof brain !== 'undefined') {
            this.available = true;
            console.log('[NeuralTrainer] Brain.js available');
        } else {
            this.available = false;
            console.warn('[NeuralTrainer] Brain.js not available');
        }
        
        return this;
    }

    // ========== NETWORK CREATION ==========

    createNetwork(config = {}) {
        if (!this.available) {
            console.warn('[NeuralTrainer] Brain.js not available');
            return null;
        }

        const hiddenLayers = config.hiddenLayers || this.settings.hiddenLayers;
        
        this.network = new brain.recurrent.LSTM({
            hiddenLayers: hiddenLayers,
            learningRate: config.learningRate || this.settings.learningRate
        });

        console.log(`[NeuralTrainer] Network created with ${hiddenLayers.join('-')} hidden layers`);
        return this.network;
    }

    // ========== DATA MANAGEMENT ==========

    addTrainingData(input, output) {
        this.trainingData.push({ input, output });
        return this.trainingData.length;
    }

    addTrainingDataBatch(data) {
        data.forEach(({ input, output }) => {
            this.trainingData.push({ input, output });
        });
        return this.trainingData.length;
    }

    clearTrainingData() {
        this.trainingData = [];
        console.log('[NeuralTrainer] Training data cleared');
    }

    getTrainingDataCount() {
        return this.trainingData.length;
    }

    // ========== TRAINING ==========

    async train(config = {}) {
        if (!this.available || this.trainingData.length === 0) {
            return { success: false, error: 'No training data or Brain.js not available' };
        }

        if (this.isTraining) {
            return { success: false, error: 'Training already in progress' };
        }

        this.isTraining = true;
        const startTime = Date.now();
        
        const settings = {
            iterations: config.iterations || this.settings.iterations,
            errorThresh: config.errorThresh || this.settings.errorThresh,
            learningRate: config.learningRate || this.settings.learningRate
        };

        console.log(`[NeuralTrainer] Starting training with ${this.trainingData.length} samples...`);

        // Create network if not exists
        if (!this.network) {
            this.createNetwork({ hiddenLayers: config.hiddenLayers });
        }

        return new Promise((resolve) => {
            const trainingResult = this.network.train(this.trainingData, {
                iterations: settings.iterations,
                errorThresh: settings.errorThresh,
                learningRate: settings.learningRate,
                log: (stats) => {
                    this.stats = stats;
                    this.emit('training:progress', stats);
                },
                logPeriod: 10
            });

            this.stats = trainingResult;
            this.stats.time = Date.now() - startTime;
            this.isTraining = false;

            console.log(`[NeuralTrainer] Training completed in ${this.stats.time}ms`);
            console.log(`[NeuralTrainer] Final error: ${this.stats.error.toFixed(6)}`);
            console.log(`[NeuralTrainer] Iterations: ${this.stats.iterations}`);

            this.emit('training:complete', this.stats);
            resolve({
                success: true,
                error: this.stats.error,
                iterations: this.stats.iterations,
                time: this.stats.time
            });
        });
    }

    // ========== PREDICTION ==========

    async predict(input) {
        if (!this.network) {
            return { success: false, error: 'No trained network available' };
        }

        try {
            const result = this.network.run(input);
            return {
                success: true,
                result: result,
                formatted: typeof result === 'string' ? result : JSON.stringify(result)
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async classify(input) {
        if (!this.network) {
            return { success: false, error: 'No trained network available' };
        }

        try {
            const result = this.network.classify(input);
            return {
                success: true,
                result: result
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ========== PRE-TRAINED MODELS ==========

    async loadPreTrainedModel(modelType) {
        const models = {
            'sentiment-id': {
                name: 'Indonesian Sentiment Analysis',
                description: 'Analisis sentimen untuk teks Bahasa Indonesia',
                trainingData: [
                    { input: 'saya sangat senang hari ini', output: 'positive' },
                    { input: 'bagus sekali', output: 'positive' },
                    { input: 'luar biasa', output: 'positive' },
                    { input: 'saya sedih', output: 'negative' },
                    { input: 'kecewa sekali', output: 'negative' },
                    { input: 'buruk', output: 'negative' },
                    { input: 'netral saja', output: 'neutral' }
                ]
            },
            'text-gen': {
                name: 'Text Generation',
                description: 'Generate teks berdasarkan pola',
                trainingData: [
                    { input: 'halo', output: 'hai' },
                    { input: 'apa kabar', output: 'baik' },
                    { input: 'terima kasih', output: 'sama sama' }
                ]
            }
        };

        const model = models[modelType];
        if (!model) {
            return { success: false, error: `Model '${modelType}' not found` };
        }

        // Load training data
        this.trainingData = model.trainingData;
        
        // Train model
        const result = await this.train({ iterations: 500 });
        
        return {
            success: result.success,
            modelName: model.name,
            description: model.description,
            trainingResult: result
        };
    }

    // ========== EXPORT/IMPORT ==========

    exportModel() {
        if (!this.network) {
            return { success: false, error: 'No model to export' };
        }

        const modelData = {
            network: this.network.toJSON(),
            settings: this.settings,
            trainingData: this.trainingData.slice(0, 100), // Limit export size
            exportDate: new Date().toISOString()
        };

        return {
            success: true,
            data: modelData
        };
    }

    async importModel(modelData) {
        try {
            this.settings = modelData.settings || this.settings;
            this.trainingData = modelData.trainingData || [];
            
            if (modelData.network) {
                this.network = new brain.recurrent.LSTM();
                this.network.fromJSON(modelData.network);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    downloadModel() {
        const exportData = this.exportModel();
        if (!exportData.success) {
            console.error(exportData.error);
            return;
        }

        const blob = new Blob([JSON.stringify(exportData.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amelia-neural-model-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('[NeuralTrainer] Model downloaded');
    }

    async loadModelFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const modelData = JSON.parse(e.target.result);
                    const result = await this.importModel(modelData);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // ========== STATUS & STATISTICS ==========

    getStatus() {
        return {
            available: this.available,
            isTraining: this.isTraining,
            trainingDataCount: this.trainingData.length,
            hasModel: this.network !== null,
            stats: this.stats,
            settings: this.settings
        };
    }

    // ========== EVENT HANDLING ==========

    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // ========== UTILITY ==========

    reset() {
        this.network = null;
        this.trainingData = [];
        this.isTraining = false;
        this.stats = { iterations: 0, error: 1, time: 0 };
    }

    // ========== PREDEFINED TRAINING RECIPES ==========

    getTrainingRecipes() {
        return [
            {
                id: 'sentiment-id',
                name: 'Indonesian Sentiment Analysis',
                description: 'Training model untuk analisis sentimen Bahasa Indonesia',
                samples: [
                    { input: 'saya sangat senang dan bahagia', output: 'positive' },
                    { input: 'bagus sekali, luar biasa', output: 'positive' },
                    { input: 'saya cinta produk ini', output: 'positive' },
                    { input: 'terima kasih banyak', output: 'positive' },
                    { input: 'saya kecewa dan sedih', output: 'negative' },
                    { input: 'buruk sekali, tidak recommend', output: 'negative' },
                    { input: 'saya marah dengan pelayanan', output: 'negative' },
                    { input: 'tidak sesuai ekspektasi', output: 'negative' },
                    { input: 'ini biasa saja', output: 'neutral' },
                    { input: 'tidak ada komentar', output: 'neutral' }
                ]
            },
            {
                id: 'text-classification',
                name: 'Text Classification',
                description: 'Klasifikasi teks ke kategori',
                samples: [
                    { input: 'beli laptop baru', output: 'technology' },
                    { input: 'memasak nasi goreng', output: 'food' },
                    { input: 'jalan jalan ke pantai', output: 'travel' },
                    { input: 'belajar programming', output: 'education' },
                    { input: 'main game online', output: 'entertainment' }
                ]
            },
            {
                id: 'greeting-response',
                name: 'Greeting & Response',
                description: 'Training untuk percakapan dasar',
                samples: [
                    { input: 'halo', output: 'hai' },
                    { input: 'selamat pagi', output: 'selamat pagi juga' },
                    { input: 'apa kabar', output: 'baik, terima kasih' },
                    { input: 'terima kasih', output: 'sama sama' },
                    { input: 'selamat tinggal', output: 'dadah' }
                ]
            }
        ];
    }

    async trainWithRecipe(recipeId) {
        const recipes = this.getTrainingRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            return { success: false, error: `Recipe '${recipeId}' not found` };
        }

        // Load recipe data
        this.trainingData = recipe.samples;
        
        // Train
        const result = await this.train({ iterations: 1000 });
        
        return {
            success: result.success,
            recipeName: recipe.name,
            trainingResult: result
        };
    }
}

// Export
window.NeuralNetworkTrainer = NeuralNetworkTrainer;

