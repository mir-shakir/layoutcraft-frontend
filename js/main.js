/**
 * Main application logic for LayoutCraft
 */

/**
 * Main application logic for LayoutCraft with authentication
 */

function layoutCraftApp() {
    return {
        // Existing state
        prompt: '',
        dimensions: {
            width: 1200,
            height: 630
        },
        selectedModel: 'gemini-1.5-flash',
        isGenerating: false,
        generatedImage: null,
        errorMessage: null,
        showAdvanced: false,
        filename: '',

        // Authentication state (from Alpine store)
        get isAuthenticated() {
            return this.$store.auth?.isAuthenticated || false;
        },

        get currentUser() {
            return this.$store.auth?.user || null;
        },

        // Templates
        templates: {
            social: "Create a vibrant social media post with glassmorphism design, featuring bold typography and colorful gradients",
            blog: "Design a professional blog header with clean typography, subtle gradients, and modern layout",
            presentation: "Generate a sleek presentation slide with minimalist design, focusing on clarity and visual hierarchy"
        },

        // Initialize
        init() {
            this.loadDraft();
            this.setupKeyboardShortcuts();
            this.setupAuthListeners();
            this.updateUIState();
            console.log('LayoutCraft initialized with authentication');
        },

        // Setup authentication listeners
        setupAuthListeners() {
            document.addEventListener('loginSuccess', () => {
                this.updateUIState();
                this.loadDraft(); // Reload user-specific drafts
            });

            document.addEventListener('logout', () => {
                this.updateUIState();
                this.clearDraft(); // Clear user-specific data
            });
        },

        // Update UI state based on authentication
        updateUIState() {
            // Update usage display
            if (this.currentUser) {
                this.updateUsageDisplay();
            }

            // Update form state
            this.updateFormState();
        },

        // Update usage display
        updateUsageDisplay() {
            const user = this.currentUser;
            if (!user) return;

            const usageLimits = {
                'free': 10,
                'pro': 500,
                'enterprise': Infinity
            };

            const limit = usageLimits[user.subscription_tier] || 10;
            const remaining = Math.max(0, limit - user.usage_count);

            // Update usage indicators in UI
            document.querySelectorAll('[data-usage-current]').forEach(el => {
                el.textContent = user.usage_count;
            });

            document.querySelectorAll('[data-usage-limit]').forEach(el => {
                el.textContent = limit === Infinity ? '∞' : limit;
            });

            document.querySelectorAll('[data-usage-remaining]').forEach(el => {
                el.textContent = remaining === Infinity ? '∞' : remaining;
            });
        },

        // Update form state based on authentication
        updateFormState() {
            const generateButton = document.querySelector('[data-generate-button]');
            if (generateButton) {
                if (!this.isAuthenticated) {
                    generateButton.textContent = 'Login to Generate';
                    generateButton.classList.add('auth-required');
                } else if (!window.authGuard?.hasUsageRemaining()) {
                    generateButton.textContent = 'Usage Limit Reached';
                    generateButton.classList.add('usage-limit-reached');
                } else {
                    generateButton.textContent = 'Generate Image';
                    generateButton.classList.remove('auth-required', 'usage-limit-reached');
                }
            }
        },

        // Load draft with user context
        loadDraft() {
            const draftKey = this.currentUser ?
                `layoutcraft-draft-${this.currentUser.id}` :
                'layoutcraft-draft';

            const draft = localStorage.getItem(draftKey);
            if (draft) {
                try {
                    const data = JSON.parse(draft);
                    this.prompt = data.prompt || '';
                    this.dimensions = { ...this.dimensions, ...data.dimensions };
                    this.selectedModel = data.selectedModel || 'gemini-1.5-flash';
                } catch (e) {
                    console.warn('Failed to load draft:', e);
                }
            }
        },

        // Save draft with user context
        saveDraft() {
            const draftKey = this.currentUser ?
                `layoutcraft-draft-${this.currentUser.id}` :
                'layoutcraft-draft';

            const draft = {
                prompt: this.prompt,
                dimensions: this.dimensions,
                selectedModel: this.selectedModel
            };
            localStorage.setItem(draftKey, JSON.stringify(draft));
        },

        // Clear draft
        clearDraft() {
            const draftKey = this.currentUser ?
                `layoutcraft-draft-${this.currentUser.id}` :
                'layoutcraft-draft';

            localStorage.removeItem(draftKey);
        },

        // Setup keyboard shortcuts
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

        // Set template
        setTemplate(type) {
            this.prompt = this.templates[type];
            this.saveDraft();
        },

        // Generate image with authentication checks
        async generateImage() {
            // Check authentication
            if (!window.authGuard?.requireUsageLimit()) {
                return;
            }

            if (!this.prompt.trim() || this.isGenerating) return;

            this.isGenerating = true;
            this.errorMessage = null;
            this.saveDraft();

            try {
                const response = await fetch('http://127.0.0.1:8000/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                    body: JSON.stringify({
                        prompt: this.prompt,
                        width: this.dimensions.width,
                        height: this.dimensions.height,
                        model: this.selectedModel
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Generation failed');
                }

                const imageBlob = await response.blob();

                // Clean up previous image
                if (this.generatedImage) {
                    URL.revokeObjectURL(this.generatedImage);
                }

                this.generatedImage = URL.createObjectURL(imageBlob);
                this.filename = this.generateFilename();

                // Update user data (usage count)
                if (this.$store.auth) {
                    this.$store.auth.refreshUserData();
                }
                document.dispatchEvent(new CustomEvent('generationComplete', {
                    detail: { imageUrl: this.generatedImage }
                  }));

                // Update UI state
                this.updateUIState();

            } catch (error) {
                this.errorMessage = error.message || 'Failed to generate image. Please try again.';
                console.error('Generation failed:', error);
            } finally {
                this.isGenerating = false;
            }
        },

        // Regenerate image
        regenerateImage() {
            this.generateImage();
        },

        // Generate filename
        generateFilename() {
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
            const promptSlug = this.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
            const userPrefix = this.currentUser ? `${this.currentUser.id.slice(0, 8)}_` : '';
            return `layoutcraft_${userPrefix}${promptSlug}_${timestamp}.png`;
        },

        // Add to history (user-specific)
        addToHistory(item) {
            const historyKey = this.currentUser ?
                `layoutcraft-history-${this.currentUser.id}` :
                'layoutcraft-history';

            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            history.unshift(item);

            // Keep only last 10 items
            if (history.length > 10) {
                history.splice(10);
            }

            localStorage.setItem(historyKey, JSON.stringify(history));
        },

        // Get user history
        getUserHistory() {
            const historyKey = this.currentUser ?
                `layoutcraft-history-${this.currentUser.id}` :
                'layoutcraft-history';

            return JSON.parse(localStorage.getItem(historyKey) || '[]');
        },

        // Authentication actions
        showLogin() {
            if (this.$store.auth) {
                this.$store.auth.showLoginModal = true;
            }
        },

        showRegister() {
            if (this.$store.auth) {
                this.$store.auth.showRegisterModal = true;
            }
        },

        logout() {
            if (this.$store.auth) {
                this.$store.auth.handleLogout();
            }
        },

        // Watch for changes
        $watch: {
            prompt() {
                this.saveDraft();
            },
            dimensions: {
                handler() {
                    this.saveDraft();
                },
                deep: true
            },
            selectedModel() {
                this.saveDraft();
            }
        }
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('LayoutCraft loaded with authentication');
});

  