/**
 * LayoutCraft MVP - Main Application Logic
 * A focused script for the core generation experience with an engaging UI.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('layoutCraftApp', () => ({
        // --- STATE --- //
        prompt: '',
        dimensions: { width: 1200, height: 630 },
        selectedModel: 'gemini-2.5-pro',
        isGenerating: false,
        generatedImage: null,
        errorMessage: null,
        filename: '',

        // New state for loading animation
        loadingMessage: 'Starting the creative engine...',
        loadingInterval: null,

        // --- TEMPLATES (Easy to edit) --- //
        templates: {
            social: "A vibrant social media post for a tech conference, using a glassmorphism design with bold, futuristic typography and colorful gradients.",
            blog: "A professional blog header for an article about the future of AI, featuring a clean, minimalist layout and subtle, elegant gradients.",
            presentation: "A sleek and modern presentation slide for a business proposal, designed with a focus on clarity, readability, and visual hierarchy."
            // Add more templates here, e.g.:
            // ad_banner: "An eye-catching ad banner for a new mobile app, with a compelling call-to-action and bright, energetic colors."
        },

        // --- LIFECYCLE --- //
        init() {
            this.loadDraft();
            this.setupKeyboardShortcuts();
            console.log('LayoutCraft MVP Initialized');
        },

        // --- METHODS --- //

        /**
         * Starts the animated loading text sequence.
         */
        startLoadingAnimation() {
            const messages = [
                'Warming up the AI brain...',
                'Mixing digital paint...',
                'Consulting with the design muses...',
                'Translating ideas into pixels...',
                'Reticulating splines...',
                'Almost there, adding the final sparkle...'
            ];
            let messageIndex = 0;
            this.loadingMessage = messages[messageIndex]; // Set initial message

            this.loadingInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                this.loadingMessage = messages[messageIndex];
            }, 3000); // Change message every 3 seconds
        },

        /**
         * Stops the animated loading text sequence.
         */
        stopLoadingAnimation() {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
            this.loadingMessage = 'Starting the creative engine...'; // Reset for next time
        },

        /**
         * Loads a saved draft from localStorage.
         */
        loadDraft() {
            const draft = localStorage.getItem('layoutcraft-mvp-draft');
            if (draft) {
                try {
                    const data = JSON.parse(draft);
                    this.prompt = data.prompt || '';
                } catch (e) {
                    console.warn('Failed to load draft:', e);
                    localStorage.removeItem('layoutcraft-mvp-draft');
                }
            }
        },

        /**
         * Saves the current prompt to localStorage.
         */
        saveDraft() {
            const draft = { prompt: this.prompt };
            localStorage.setItem('layoutcraft-mvp-draft', JSON.stringify(draft));
        },

        /**
         * Sets up keyboard shortcuts (Ctrl+Enter to generate).
         */
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.generateImage();
                }
                if (e.key === 'Escape') {
                    this.errorMessage = null;
                }
            });
        },

        /**
         * Applies a predefined template to the prompt.
         * @param {string} key - The key of the template to use.
         */
        setTemplate(key) {
            if (this.templates[key]) {
                this.prompt = this.templates[key];
                this.saveDraft();
            }
        },

        /**
         * Main function to generate an image from the backend.
         */
        async generateImage() {
            if (!this.prompt.trim() || this.isGenerating) return;

            this.isGenerating = true;
            this.errorMessage = null;
            this.generatedImage = null;
            this.saveDraft();
            this.startLoadingAnimation(); // Start the fun loading text

            const API_BASE_URL = 'http://127.0.0.1:8000';
            const API_TIMEOUT = 1200000;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

            try {
                const response = await fetch(`${API_BASE_URL}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: this.prompt,
                        width: this.dimensions.width,
                        height: this.dimensions.height,
                        model: this.selectedModel
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Generation failed with status: ${response.status}`);
                }

                const imageBlob = await response.blob();
                if (this.generatedImage) URL.revokeObjectURL(this.generatedImage);
                this.generatedImage = URL.createObjectURL(imageBlob);
                this.filename = this.generateFilename();

            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    this.errorMessage = 'Request timed out. The server is taking too long.';
                } else if (error.message.includes('Failed to fetch')) {
                    this.errorMessage = 'Cannot connect to the server. Is it running?';
                } else {
                    this.errorMessage = error.message || 'An unknown error occurred.';
                }
                console.error('Generation failed:', error);
            } finally {
                this.isGenerating = false;
                this.stopLoadingAnimation(); // Stop the loading text animation
            }
        },

        /**
         * Triggers a new generation with the current settings.
         */
        regenerateImage() {
            this.generateImage();
        },

        /**
         * Creates a descriptive filename for the download.
         * @returns {string} The generated filename.
         */
        generateFilename() {
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
            const promptSlug = this.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
            return `layoutcraft_${promptSlug}_${timestamp}.png`;
        },

        // --- WATCHERS --- //
        $watch: {
            prompt() { this.saveDraft(); }
        }
    }));
});
