/**
 * ============================================
 * AMELIA AI - IMAGE MANAGER
 * Enhanced image upload, analysis, and editing
 * ============================================
 */

class ImageManager {
    constructor() {
        this.uploadedImages = [];
        this.currentImage = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.results = new Map();
        
        // Canvas for processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // ========== INITIALIZATION ==========

    init() {
        console.log('[ImageManager] Initializing...');
        this.setupDragDrop();
        return this;
    }

    // ========== IMAGE UPLOAD ==========

    async uploadImage(file) {
        return new Promise((resolve, reject) => {
            // Validate file
            if (!this.validateFile(file)) {
                resolve({ success: false, error: 'Invalid file type or size' });
                return;
            }

            var reader = new FileReader();
            reader.onload = (e) => {
                var img = new Image();
                img.onload = () => {
                    var imageData = {
                        id: this.generateId(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        width: img.width,
                        height: img.height,
                        src: e.target.result,
                        uploadedAt: Date.now(),
                        metadata: {}
                    };
                    this.uploadedImages.push(imageData);
                    console.log('[ImageManager] Image uploaded:', imageData.name);
                    resolve({ success: true, image: imageData });
                };
                img.onerror = () => resolve({ success: false, error: 'Failed to load image' });
                img.src = e.target.result;
            };
            reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
            reader.readAsDataURL(file);
        });
    }

    validateFile(file) {
        return this.allowedTypes.includes(file.type) && file.size <= this.maxFileSize;
    }

    async uploadMultiple(files) {
        var results = [];
        for (var i = 0; i < files.length; i++) {
            var result = await this.uploadImage(files[i]);
            results.push(result);
        }
        return results;
    }

    // ========== DRAG AND DROP ==========

    setupDragDrop() {
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            var files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });
    }

    async handleFiles(files) {
        var imageFiles = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
                imageFiles.push(files[i]);
            }
        }
        
        if (imageFiles.length > 0) {
            var results = await this.uploadMultiple(imageFiles);
            this.emit('images:uploaded', results);
            return results;
        }
        return [];
    }

    // ========== IMAGE ANALYSIS ==========

    async analyzeImage(imageData) {
        var img = await this.loadImage(imageData.src);
        var results = {
            imageId: imageData.id,
            dimensions: { width: img.width, height: img.height },
            analyzedAt: Date.now()
        };

        try {
            // TensorFlow.js analysis if available
            if (typeof mobilenet !== 'undefined' && window.multiAI) {
                var tfResults = await window.multiAI.analyzeImage(img);
                results.classifications = tfResults.classifications;
                results.objects = tfResults.objects;
            } else {
                // Basic analysis
                results.basicInfo = this.getBasicImageInfo(img);
            }

            // AI description if available
            if (window.AIConnection && window.AIConnection.available) {
                var classNames = results.classifications 
                    ? results.classifications.slice(0, 3).map(c => c.className).join(', ')
                    : 'unknown objects';
                var descPrompt = 'Describe an image containing: ' + classNames + '. Give a detailed description.';
                results.aiDescription = await window.AIConnection.chat(descPrompt);
            }

            this.results.set(imageData.id, results);
            this.emit('image:analyzed', results);
            
            return { success: true, results: results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    getBasicImageInfo(img) {
        return {
            aspectRatio: (img.width / img.height).toFixed(2),
            megapixels: ((img.width * img.height) / 1000000).toFixed(2),
            format: img.src.substring(5, img.src.indexOf(';'))
        };
    }

    // ========== IMAGE EDITING ==========

    async cropImage(imageData, options) {
        var img = await this.loadImage(imageData.src);
        
        var x = options.x || 0;
        var y = options.y || 0;
        var width = options.width || img.width / 2;
        var height = options.height || img.height / 2;

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        var croppedSrc = this.canvas.toDataURL('image/png');
        
        return {
            success: true,
            image: {
                ...imageData,
                src: croppedSrc,
                width: width,
                height: height,
                cropped: true
            }
        };
    }

    async resizeImage(imageData, options) {
        var img = await this.loadImage(imageData.src);
        
        var newWidth = options.width || img.width;
        var newHeight = options.height || (img.height * newWidth / img.width);

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(img, 0, 0, newWidth, newHeight);

        var resizedSrc = this.canvas.toDataURL('image/png');
        
        return {
            success: true,
            image: {
                ...imageData,
                src: resizedSrc,
                width: newWidth,
                height: newHeight,
                resized: true
            }
        };
    }

    async applyFilter(imageData, filterType) {
        var img = await this.loadImage(imageData.src);
        
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        var imageDataObj = this.ctx.getImageData(0, 0, img.width, img.height);
        var data = imageDataObj.data;

        switch (filterType) {
            case 'grayscale':
                for (var i = 0; i < data.length; i += 4) {
                    var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                }
                break;
            case 'sepia':
                for (var i = 0; i < data.length; i += 4) {
                    var r = data[i], g = data[i + 1], b = data[i + 2];
                    data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
                    data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
                    data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
                }
                break;
            case 'brightness':
                for (var i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] + 50);
                    data[i + 1] = Math.min(255, data[i + 1] + 50);
                    data[i + 2] = Math.min(255, data[i + 2] + 50);
                }
                break;
            case 'contrast':
                var factor = (259 * (50 + 255)) / (255 * (259 - 50));
                for (var i = 0; i < data.length; i += 4) {
                    data[i] = factor * (data[i] - 128) + 128;
                    data[i + 1] = factor * (data[i + 1] - 128) + 128;
                    data[i + 2] = factor * (data[i + 2] - 128) + 128;
                }
                break;
        }

        this.ctx.putImageData(imageDataObj, 0, 0);
        var filteredSrc = this.canvas.toDataURL('image/png');
        
        return {
            success: true,
            image: {
                ...imageData,
                src: filteredSrc,
                filter: filterType,
                filtered: true
            }
        };
    }

    // ========== IMAGE EXPORT ==========

    downloadImage(imageData, format) {
        format = format || 'png';
        var link = document.createElement('a');
        link.download = 'amelia-image-' + imageData.id + '.' + format;
        link.href = imageData.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('[ImageManager] Image downloaded:', link.download);
    }

    // ========== IMAGE MANAGEMENT ==========

    getImage(imageId) {
        return this.uploadedImages.find(img => img.id === imageId);
    }

    getAllImages() {
        return this.uploadedImages;
    }

    deleteImage(imageId) {
        var index = this.uploadedImages.findIndex(img => img.id === imageId);
        if (index !== -1) {
            this.uploadedImages.splice(index, 1);
            this.results.delete(imageId);
            return { success: true };
        }
        return { success: false, error: 'Image not found' };
    }

    clearAllImages() {
        this.uploadedImages = [];
        this.results.clear();
        return { success: true };
    }

    // ========== EVENTS ==========

    on(event, callback) {
        if (!this.eventListeners) this.eventListeners = new Map();
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(cb => cb(data));
        }
    }

    // ========== UTILITY ==========

    generateId() {
        return 'img_' + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ========== STATUS ==========

    getStatus() {
        return {
            imageCount: this.uploadedImages.length,
            totalSize: this.uploadedImages.reduce((sum, img) => sum + img.size, 0),
            maxFileSize: this.formatFileSize(this.maxFileSize),
            allowedTypes: this.allowedTypes
        };
    }
}

window.ImageManager = ImageManager;

