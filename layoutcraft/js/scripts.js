/**
 * LayoutCraft MVP - Enhanced Application Logic
 * A focused script for the core generation experience with an engaging UI.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('layoutCraftApp', () => ({
        // --- STATE --- //
        isReady: false,
        prompt: '',
        dimensions: { width: 1200, height: 630 },
        selectedEngine: 'fast', // 'fast' or 'pro'
        isGenerating: false,
        generatedImage: null,
        errorMessage: null,
        filename: '',
        showPreview: false,
        feedbackEmail: '', 
        
        // Feedback state
        feedbackMessage: '',
        isSubmittingFeedback: false,
        showSuccessToast: false,

        // Loading animation state
        loadingMessage: 'Warming up the AI engine...',
        loadingInterval: null,

        // --- TEMPLATES (Enhanced) --- //
        templates: {
            blog: "A professional blog header about artificial intelligence and machine learning, featuring clean typography, subtle gradients, and modern design elements that convey innovation and expertise.",
            social: "An eye-catching social media post for a tech startup launch, with vibrant colors, bold typography, and engaging visual elements that encourage sharing and interaction.",
            presentation: "A sleek business presentation slide for a quarterly review, with clear data visualization, professional color scheme, and minimalist design that emphasizes key metrics and achievements."
        },

        // Model mapping for backend
        modelMapping: {
            'fast': 'gemini-2.5-flash',
            'pro': 'gemini-2.5-pro'
        },

        // --- LIFECYCLE --- //
        init() {
            this.loadDraft();
            this.setupKeyboardShortcuts();
            this.detectUserPreferences();
            this.isReady = true;
            this.showSuccessToast = false;
            this.errorMessage = null;
            console.log('LayoutCraft MVP Enhanced - Initialized');
        },

        // --- METHODS --- //

        /**
         * Detects user preferences and sets defaults accordingly
         */
        detectUserPreferences() {
            // Set engine based on connection speed (rough heuristic)
            if (navigator.connection && navigator.connection.effectiveType) {
                const connectionType = navigator.connection.effectiveType;
                if (connectionType === '4g' || connectionType === 'wifi') {
                    this.selectedEngine = 'pro';
                } else {
                    this.selectedEngine = 'fast';
                }
            }
        },

        /**
         * Enhanced loading animation with more contextual messages
         */

        startLoadingAnimation() {
            const engineMessages = {
                fast: [
                    'Warming up the lightning-fast engine...',
                    'Analyzing your creative vision...',
                    'Mixing pixels and possibilities...',
                    'Crafting visual magic at light speed...',
                    'Assembling creative elements...',
                    'Optimizing for maximum impact...',
                    'Adding that perfect spark...',
                    'Almost there, adding final touches...',
                    'Polishing your creation...',
                    'Rendering your masterpiece...',
                    'Just a moment more...',
                    'Putting on the finishing touches...',
                    'Final quality check in progress...'
                ],
                pro: [
                    'Initializing professional AI engine...',
                    'Deep analysis of your requirements...',
                    'Studying design principles and aesthetics...',
                    'Crafting high-quality design elements...',
                    'Applying advanced algorithms...',
                    'Fine-tuning color harmony and balance...',
                    'Optimizing composition and layout...',
                    'Enhancing visual storytelling...',
                    'Fine-tuning every detail...',
                    'Applying professional polish...',
                    'Conducting quality assurance...',
                    'Adding signature professional touches...',
                    'Almost ready, perfecting the design...',
                    'Final quality check in progress...'
                ]
            };

            const messages = engineMessages[this.selectedEngine];
            let messageIndex = 0;
            this.loadingMessage = messages[messageIndex];

            this.loadingInterval = setInterval(() => {
                messageIndex++;

                // Check if we've reached the end of messages
                if (messageIndex >= messages.length) {
                    // Stop the interval and keep the last message
                    clearInterval(this.loadingInterval);
                    this.loadingMessage = messages[messages.length - 1];
                    return;
                }

                this.loadingMessage = messages[messageIndex];
            }, this.selectedEngine === 'fast' ? 3500 : 6000);
        },


        /**
         * Stops the animated loading text sequence
         */
        stopLoadingAnimation() {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
            this.loadingMessage = 'Warming up the AI engine...';
        },

        /**
         * Enhanced draft loading with error handling
         */
        loadDraft() {
            try {
                const draft = localStorage.getItem('layoutcraft-mvp-draft');
                if (draft) {
                    const data = JSON.parse(draft);
                    this.prompt = data.prompt || '';
                    this.selectedEngine = data.engine || 'fast';
                    this.dimensions = data.dimensions || { width: 1200, height: 630 };
                }
            } catch (e) {
                console.warn('Failed to load draft:', e);
                localStorage.removeItem('layoutcraft-mvp-draft');
            }
        },

        /**
         * Enhanced draft saving
         */
        saveDraft() {
            try {
                const draft = { 
                    prompt: this.prompt,
                    engine: this.selectedEngine,
                    dimensions: this.dimensions,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('layoutcraft-mvp-draft', JSON.stringify(draft));
            } catch (e) {
                console.warn('Failed to save draft:', e);
            }
        },

        /**
         * Enhanced keyboard shortcuts
         */
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Enter or Cmd+Enter to generate
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.generateImage();
                }
                
                // Escape to close modals
                if (e.key === 'Escape') {
                    this.errorMessage = null;
                    this.showPreview = false;
                }
                
                // Quick engine switching with Alt+1/2
                if (e.altKey && e.key === '1') {
                    e.preventDefault();
                    this.selectedEngine = 'fast';
                    this.saveDraft();
                }
                if (e.altKey && e.key === '2') {
                    e.preventDefault();
                    this.selectedEngine = 'pro';
                    this.saveDraft();
                }
            });
        },

        /**
         * Enhanced template setting with user feedback
         */
        setTemplate(key) {
            if (this.templates[key]) {
                this.prompt = this.templates[key];
                this.saveDraft();
                
                // Brief visual feedback
                const templateButton = document.querySelector(`[onclick*="${key}"]`);
                if (templateButton) {
                    templateButton.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        templateButton.style.transform = '';
                    }, 150);
                }
            }
        },

        /**
         * Enhanced error message formatting
         */
        formatErrorMessage(error) {
            const errorMappings = {
                'Failed to fetch': 'Unable to connect to our servers. Please check your internet connection and try again.',
                'NetworkError': 'Network connection failed. Please check your internet and try again.',
                'timeout': 'The request took too long to complete. Our servers might be busy - please try again in a moment.',
                '429': 'You\'ve reached the rate limit. Please wait a minute before generating another image.',
                '500': 'Our servers are experiencing issues. Please try again in a few minutes.',
                '503': 'Our service is temporarily unavailable. Please try again shortly.',
                'AbortError': 'Request was cancelled due to timeout. The AI engine might be overloaded - please try again.'
            };

            const message = error.message || error.toString();
            
            // Check for specific error patterns
            for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
                if (message.includes(pattern) || message.includes(pattern.toLowerCase())) {
                    return friendlyMessage;
                }
            }

            // Handle HTTP status codes
            const statusMatch = message.match(/status:?\s*(\d+)/i);
            if (statusMatch) {
                const status = statusMatch[1];
                if (errorMappings[status]) {
                    return errorMappings[status];
                }
            }

            // Default fallback with helpful suggestion
            return `Something went wrong: ${message}. Please try again or contact support if the problem persists.`;
        },

        /**
         * Enhanced image generation with better error handling and analytics
         */
        async generateImage() {
            if (!this.prompt.trim() || this.isGenerating) return;

            // Validation
            if (this.prompt.length < 10) {
                this.errorMessage = 'Please provide a more detailed description (at least 10 characters) to get better results.';
                return;
            }

            this.isGenerating = true;
            this.errorMessage = null;
            this.generatedImage = null;
            this.saveDraft();
            this.startLoadingAnimation();

            const API_BASE_URL = 'http://127.0.0.1:8000';
            const API_TIMEOUT = this.selectedEngine === 'fast' ? 60000 : 120000; // Different timeouts for different engines

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

            const startTime = Date.now();

            try {
                const response = await fetch(`${API_BASE_URL}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: this.prompt,
                        width: this.dimensions.width,
                        height: this.dimensions.height,
                        model: this.modelMapping[this.selectedEngine] // Send actual model name
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch {
                        errorData = { detail: `Server error (${response.status})` };
                    }
                    throw new Error(errorData.detail || `Generation failed with status: ${response.status}`);
                }

                const imageBlob = await response.blob();
                
                // Clean up previous image URL
                if (this.generatedImage) {
                    URL.revokeObjectURL(this.generatedImage);
                }
                
                this.generatedImage = URL.createObjectURL(imageBlob);
                this.filename = this.generateFilename();

                // Track generation success (simple client-side analytics)
                const generationTime = Date.now() - startTime;
                console.log(`Generation successful: ${generationTime}ms using ${this.selectedEngine} engine`);

            } catch (error) {
                clearTimeout(timeoutId);
                this.errorMessage = this.formatErrorMessage(error);
                console.error('Generation failed:', error);
                
                // Track error for debugging
                console.log(`Generation failed after ${Date.now() - startTime}ms using ${this.selectedEngine} engine:`, error.message);
                
            } finally {
                this.isGenerating = false;
                this.stopLoadingAnimation();
            }
        },

        /**
         * Enhanced regeneration with slight prompt variation
         */
        regenerateImage() {
            // Add a small variation to get different results
            const originalPrompt = this.prompt;
            const variations = [
                ', with a fresh creative perspective',
                ', using an alternative design approach',
                ', with enhanced visual appeal',
                ', incorporating modern design trends',
                ', with improved composition'
            ];
            
            const variation = variations[Math.floor(Math.random() * variations.length)];
            this.prompt = originalPrompt + variation;
            
            this.generateImage().then(() => {
                // Restore original prompt after generation
                setTimeout(() => {
                    this.prompt = originalPrompt;
                    this.saveDraft();
                }, 1000);
            });
        },

        /**
         * Enhanced filename generation with better naming
         */
        generateFilename() {
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
            const promptSlug = this.prompt
                .slice(0, 40)
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s]/g, '')
                .replace(/\s+/g, '_')
                .replace(/^_+|_+$/g, ''); // Clean up leading/trailing underscores
            
            const engine = this.selectedEngine;
            const dimensions = `${this.dimensions.width}x${this.dimensions.height}`;
            
            return `layoutcraft_${promptSlug}_${engine}_${dimensions}_${timestamp}.png`;
        },

        /**
         * Feedback submission
         */
        async submitFeedback() {
            if (!this.feedbackMessage.trim() || this.isSubmittingFeedback) return;

            this.isSubmittingFeedback = true;

            try {
                const response = await fetch('http://127.0.0.1:8000/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: this.feedbackMessage,
                        email: this.feedbackEmail.trim() || null,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    })
                });

                if (response.ok) {
                    this.feedbackMessage = '';
                    this.showSuccessToast = true;
                    setTimeout(() => {
                        this.showSuccessToast = false;
                    }, 3000);
                } else {
                    throw new Error('Failed to submit feedback');
                }

            } catch (error) {
                console.error('Feedback submission failed:', error);
                this.errorMessage = 'Failed to submit feedback. Please try again later.';
            } finally {
                this.isSubmittingFeedback = false;
            }
        },

        /**
         * Download with analytics
         */
        downloadImage() {
            if (this.generatedImage) {
                // Track download event
                console.log('Image downloaded:', {
                    engine: this.selectedEngine,
                    dimensions: this.dimensions,
                    promptLength: this.prompt.length
                });
            }
        },

        /**
         * Utility method to copy prompt to clipboard
         */
        async copyPrompt() {
            try {
                await navigator.clipboard.writeText(this.prompt);
                // Could show a toast notification here
            } catch (err) {
                console.error('Failed to copy prompt:', err);
            }
        },

        /**
         * Clear all data and start fresh
         */
        clearAll() {
            this.prompt = '';
            this.generatedImage = null;
            this.errorMessage = null;
            this.feedbackMessage = '';
            this.selectedEngine = 'fast';
            localStorage.removeItem('layoutcraft-mvp-draft');
        },

        // --- WATCHERS --- //
        $watch: {
            prompt() { 
                this.saveDraft(); 
            },
            selectedEngine() { 
                this.saveDraft(); 
            },
            dimensions: {
                handler() { this.saveDraft(); },
                deep: true
            }
        }
    }));
});