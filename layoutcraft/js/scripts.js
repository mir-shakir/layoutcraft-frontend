/**
 * LayoutCraft MVP - Production Ready Application Logic
 * Enhanced with Authentication System Integration
 */

document.addEventListener('alpine:init', () => {
    // Initialize Google Analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'LayoutCraft MVP',
            page_location: window.location.href
        });
    }

    Alpine.data('layoutCraftApp', () => ({
        // --- CORE STATE --- //
        isReady: false,
        prompt: '',
        selectedEngine: 'pro',
        selectedTheme: 'auto',
        selectedSize: 'blog_header',
        isGenerating: false,
        generatedImage: null,
        errorMessage: null,
        filename: '',
        imageLoaded: false,
        imageError: false,
        failedAttempts: 0,
        retryMessage: '',
        
        // --- PREVIEW DIMENSIONS --- //
        previewAspectRatio: 1.9, // Default blog header ratio (1200/630)

        // --- AUTHENTICATION STATE --- //
        isLoggedIn: false,
        currentUser: null,
        isAuthModalOpen: false,
        authMode: 'login', // 'login' or 'signup'
        authForm: {
            email: '',
            password: '',
            full_name: '',
            errorMessage: '',
            isLoading: false
        },

        // --- UI STATE --- //
        activeSection: 'generator',
        mobileMenuOpen: false,
        loadingMessage: 'Warming up the AI engine...',
        loadingInterval: null,
        styleExpanded: true,
        qualityExpanded: true,

        // --- EMAIL & FEEDBACK STATE --- //
        showEmailForm: false,
        emailForUpdates: '',
        isSubmittingEmail: false,
        emailSubmitted: false,
        showSuccessToast: false,
        successMessage: '',

        // --- STANDALONE FEEDBACK STATE --- //
        standaloneEmail: '',
        standaloneFeedbackMessage: '',
        isSubmittingStandaloneFeedback: false,
        feedbackSubmitted: false,
        showMvpBanner: true,

        // --- CONFIGURATION --- //
        // API_BASE_URL: 'https://layoutcraft-backend.onrender.com', 
        API_BASE_URL: 'http://localhost:8000', // Use local backend for development
        PROMPT_MAX_LENGTH: 500,

        // --- AUTH SERVICE INSTANCE --- //
        authService: null,

        // --- DATA COLLECTIONS --- //
        sizePresets: [],
        
        themes: [
            { id: "glassmorphism_premium", name: "Glassmorphism" },
            { id: "bold_geometric_solid", name: "Bold Geometric" },
            { id: "textured_organic_patterns", name: "Organic" },
            { id: "minimal_luxury_space", name: "Minimal Luxury" },
            { id: "vibrant_gradient_energy", name: "Vibrant Gradient" },
            { id: "dark_neon_tech", name: "Neon Tech" },
            { id: "editorial_magazine_layout", name: "Editorial" }
        ],

        quickPrompts: [
            {
                id: 1,
                title: "Tech Blog Header",
                style: "Dark Neon Tech",
                prompt: "A modern blog header for 'The Future of AI in Design'. Use clean typography with blue accents and subtle geometric patterns."
            },
            {
                id: 2,
                title: "Summer Sale Post",
                style: "Vibrant Gradient",
                prompt: "A promotional graphic for a summer sale. Text: 'Summer Sale - 50% Off'. Use a vibrant orange and yellow gradient. Make the text large and bold."
            },
            {
                id: 3,
                title: "Luxury Background",
                style: "Minimal Luxury",
                prompt: "A simple, elegant website hero background. Use a cream color with a single, thin gold line on the left side. No text."
            },
            {
                id: 4,
                title: "Event Banner",
                style: "Editorial",
                prompt: "A professional banner for 'Tech Conference 2024 - Innovation Summit'. Use a corporate blue and white color scheme with modern geometric elements."
            }
        ],

        examples: [
            {
                id: 1,
                title: "Tech Blog Header",
                description: "Modern header for 'The Future of AI in Design' with clean typography and blue accents",
                prompt: "A modern blog header for an article titled 'The Future of AI in Design'. Use clean, professional typography with a subtle blue color scheme and geometric patterns in the background.",
                imagePath: "assets/images/example-tech-blog.png"
            },
            {
                id: 2,
                title: "Summer Sale Post",
                description: "Promotional graphic with vibrant gradients and bold text",
                prompt: "A promotional graphic for a summer sale. Text: 'Summer Sale - 50% Off'. Use a vibrant orange and yellow gradient. Make the text large and bold.",
                imagePath: "assets/images/example-summer-sale.png"
            },
            {
                id: 3,
                title: "Luxury Background",
                description: "Elegant, minimalist background with premium feel",
                prompt: "A simple, elegant website hero background. Use a cream color with a single, thin gold line on the left side. No text.",
                imagePath: "assets/images/example-luxury-minimal.png"
            },
            {
                id: 4,
                title: "Product Launch",
                description: "Announcement graphic with premium feel and gradient background",
                prompt: "A product launch announcement for 'New iPhone App - Now Available'. Use a premium gradient background with sleek typography and subtle tech-inspired elements.",
                imagePath: "assets/images/example-product-launch.png"
            },
            {
                id: 5,
                title: "Newsletter Header",
                description: "Weekly newsletter header with friendly, approachable design",
                prompt: "A header for 'Weekly Design Newsletter #24'. Use a friendly, approachable design with soft colors, readable typography, and subtle design-related icons.",
                imagePath: "assets/images/example-newsletter-header.png"
            },
            {
                id: 6,
                title: "Course Thumbnail",
                description: "Educational content thumbnail with professional layout",
                prompt: "A thumbnail for an online course called 'Master Web Design in 30 Days'. Use professional colors, clear typography, and include subtle educational elements like books or computer screens.",
                imagePath: "assets/images/example-course-thumbnail.png"
            }
        ],

        faqs: [
            {
                id: 1,
                question: "How is this different from other AI image tools?",
                answer: "<p>Unlike most AI image generators that create unpredictable artistic interpretations, LayoutCraft is tailored to follow <strong>design principles</strong> and <strong>structured layouts</strong>. We focus on creating functional, professional designs rather than artistic experiments. This means more consistent typography, better text readability, and layouts that actually work for real-world applications.</p>"
            },
            {
                id: 2,
                question: "What are some tips for writing effective prompts?",
                answer: "<ul class='list-disc pl-6 space-y-2'><li><strong>Be Specific:</strong> Instead of \"a cool header,\" try \"A website header for a tech company, with the text 'Innovate & Inspire'. Use a dark blue background and glowing geometric lines.\"</li><li><strong>Define the Mood:</strong> Use words like \"minimalist,\" \"vibrant,\" \"corporate,\" \"playful,\" or \"luxurious.\"</li><li><strong>Specify Content:</strong> Clearly state any text you want included. For example: 'Text: \"Summer Sale\"'.</li><li><strong>Guide the Colors:</strong> Mention a color palette, like \"Use a palette of warm earth tones\" or \"with green and gold accents.\"</li></ul>"
            },
            {
                id: 3,
                question: "What's the difference between 'Fast' and 'Pro' engines?",
                answer: "<p>The <strong>Fast</strong> engine uses a smaller, quicker model perfect for rapid iteration and brainstorming. It's great for quickly testing ideas and generates results in about 30 seconds.</p><p>The <strong>Pro</strong> engine uses a more powerful, advanced model that takes longer (up to 60 seconds) but produces more sophisticated, detailed, and higher-fidelity designs. We recommend using \"Fast\" to find a concept you like, then switching to \"Pro\" for the final version.</p>"
            },
            {
                id: 4,
                question: "Can I edit the generated designs?",
                answer: "<p>Currently, you can regenerate variations or adjust your prompt to refine your results. We're constantly working on new features to give users more control over their designs, including the ability to make targeted adjustments. Sign up for updates to be the first to know when these editing features become available!</p>"
            },
            {
                id: 5,
                question: "What image formats and sizes are supported?",
                answer: "<p>Currently, all images are generated at 1200×630 pixels in PNG format, which is optimized for blog headers, social media posts, and web use. This size works great for:</p><ul class='list-disc pl-6 space-y-1'><li>Blog post headers</li><li>Social media posts (Facebook, Twitter, LinkedIn)</li><li>Email newsletter headers</li><li>Website banners</li></ul><p>We're planning to add more size options in future updates.</p>"
            },
            {
                id: 6,
                question: "Is there a limit to how many designs I can generate? What about my data?",
                answer: "<p>This is a free MVP version, so there are some reasonable usage limits to ensure the service stays available for everyone. If you're generating a lot of designs, you might occasionally see a brief cooldown period.</p><p><strong>Privacy:</strong> We don't store your prompts or generated images permanently. Your designs are created on-demand and you're responsible for downloading and saving them.</p><p>We're working on a full version with higher limits and premium features. Sign up for updates to be notified when it launches!</p>"
            },
            {
                id: 7,
                question: "Can I use the generated designs commercially?",
                answer: "<p>Yes! All designs generated by LayoutCraft are yours to use commercially without restrictions. This includes using them for client work, marketing materials, social media posts, and any business purposes.</p><p>However, we recommend reviewing the designs to ensure they meet your specific brand guidelines and quality standards before publication.</p>"
            },
            {
                id: 8,
                question: "What if my generated design contains inappropriate content?",
                answer: "<p>While our AI is trained to create professional designs, we recommend reviewing all generated content before use. Users are responsible for ensuring their designs are appropriate for their intended use case.</p><p>If you encounter any issues with generated content, please use the feedback form to report it so we can continue improving our system.</p>"
            }
        ],

        modelMapping: {
            'fast': 'gemini-2.5-flash',
            'pro': 'gemini-2.5-pro'
        },

        // --- LIFECYCLE METHODS --- //
        async init() {
            // Initialize AuthService
            this.authService = new AuthService(this.API_BASE_URL);

            this.showMvpBanner = localStorage.getItem('layoutcraftMvpBannerDismissed') !== 'true';
            this.loadDraft();
            this.setupKeyboardShortcuts();
            this.setupCleanupHandlers();
            this.setupMobileCollapse();
            this.setupResizeHandler();
            this.generationProgress = 0;

            // Load size presets from backend
            await this.loadSizePresets();

            // Restore user session
            await this.restoreSession();

            // Simulate loading time for better perceived performance
            setTimeout(() => {
                this.isReady = true;
            }, 800);

            console.log('LayoutCraft MVP initialized successfully');
        },

        // --- PREVIEW CALCULATION --- //
        updatePreviewAspectRatio() {
            if (this.sizePresets.length === 0) return;
            
            const selectedPreset = this.sizePresets.find(preset => preset.key === this.selectedSize);
            if (selectedPreset) {
                this.previewAspectRatio = selectedPreset.width / selectedPreset.height;
                console.log(`Updated preview aspect ratio: ${this.previewAspectRatio} for ${selectedPreset.display_name} (${selectedPreset.width}x${selectedPreset.height})`);
            }
        },

        getPreviewStyle() {
            return this.calculateResponsiveDimensions(this.previewAspectRatio, 'preview');
        },

        calculateResponsiveDimensions(aspectRatio, type = 'preview') {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            // Define responsive breakpoints and constraints
            const breakpoints = {
                xs: { max: 375, padding: 48 },      // Extra small phones - more padding to prevent overflow
                sm: { max: 480, padding: 64 },      // Small phones  
                md: { max: 768, padding: 80 },      // Tablets
                lg: { max: 1024, padding: 80 },     // Small laptops
                xl: { max: 1440, padding: 100 },    // Large laptops
                xxl: { max: Infinity, padding: 120 } // Large desktops
            };
            
            // Determine current breakpoint
            let currentBreakpoint = 'xxl';
            for (const [key, bp] of Object.entries(breakpoints)) {
                if (screenWidth <= bp.max) {
                    currentBreakpoint = key;
                    break;
                }
            }
            
            const bp = breakpoints[currentBreakpoint];
            
            // Calculate available space with safer mobile constraints
            const availableWidth = screenWidth - bp.padding;
            const availableHeight = Math.min(screenHeight * 0.6, screenHeight - 200); // Max 60% of screen height, leave room for UI
            
            // Define size factors - larger for big screens, safer for mobile
            let sizeFactor;
            if (type === 'empty') {
                // Empty state is more conservative
                sizeFactor = {
                    xs: 0.75, sm: 0.8, md: 0.85, lg: 0.9, xl: 0.95, xxl: 1.0
                }[currentBreakpoint];
            } else {
                // Preview and loading states use full size factors
                sizeFactor = {
                    xs: 0.8, sm: 0.85, md: 0.9, lg: 0.95, xl: 1.0, xxl: 1.0
                }[currentBreakpoint];
            }
            
            // Calculate max dimensions with better scaling for large screens
            const maxWidth = Math.min(availableWidth * sizeFactor, currentBreakpoint === 'xxl' ? 900 : 800); // Larger cap for xxl screens
            const maxHeight = Math.min(availableHeight * sizeFactor, currentBreakpoint === 'xxl' ? 700 : 600); // Larger cap for xxl screens
            
            let width, height;
            
            // Scale based on aspect ratio while respecting constraints
            if (aspectRatio > maxWidth / maxHeight) {
                // Wide content - constrain by width
                width = maxWidth;
                height = width / aspectRatio;
            } else {
                // Tall content - constrain by height  
                height = maxHeight;
                width = height * aspectRatio;
            }
            
            // Apply minimum size constraints based on screen size
            const minSizes = {
                xs: { width: 140, height: 100 },
                sm: { width: 160, height: 120 },
                md: { width: 200, height: 150 },
                lg: { width: 250, height: 180 },
                xl: { width: 300, height: 200 },
                xxl: { width: 350, height: 220 }
            };
            
            const minSize = minSizes[currentBreakpoint];
            
            if (width < minSize.width) {
                const scale = minSize.width / width;
                width = minSize.width;
                height = height * scale;
            }
            
            if (height < minSize.height) {
                const scale = minSize.height / height;
                height = minSize.height;
                width = width * scale;
            }
            
            // Final safety check - ensure we never exceed available space
            // Apply stricter mobile constraints
            if (currentBreakpoint === 'xs' || currentBreakpoint === 'sm') {
                // For mobile, be extra conservative and leave more margin
                const mobileMaxWidth = screenWidth * 0.85; // Only use 85% of screen width
                const mobileMaxHeight = screenHeight * 0.4; // Only use 40% of screen height
                
                if (width > mobileMaxWidth) {
                    const scale = mobileMaxWidth / width;
                    width = mobileMaxWidth;
                    height = height * scale;
                }
                
                if (height > mobileMaxHeight) {
                    const scale = mobileMaxHeight / height;
                    height = height * scale;
                    width = width * scale;
                }
            } else {
                // Desktop safety checks
                if (width > availableWidth) {
                    const scale = availableWidth / width;
                    width = availableWidth;
                    height = height * scale;
                }
                
                if (height > availableHeight) {
                    const scale = availableHeight / height;
                    height = height * scale;
                    width = width * scale;
                }
            }
            
            return {
                width: `${Math.round(width)}px`,
                height: `${Math.round(height)}px`,
                aspectRatio: aspectRatio,
                breakpoint: currentBreakpoint
            };
        },

        getEmptyStateStyle() {
            // For empty state, use a balanced aspect ratio
            const defaultAspectRatio = 1.5; // Slightly wide rectangle
            return this.calculateResponsiveDimensions(defaultAspectRatio, 'empty');
        },

        // --- SIZE PRESETS LOADING --- //
        async loadSizePresets() {
            // Create a promise that rejects after 50ms (for fast fallback)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API timeout')), 50);
            });
            
            // Create the actual API call promise
            const apiCall = fetch(`${this.API_BASE_URL}/api/presets`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch presets: ${response.status}`);
                    }
                    return response.json();
                });
            
            try {
                // Race between API call and timeout
                const data = await Promise.race([apiCall, timeoutPromise]);
                
                // Transform the presets data for frontend use
                this.sizePresets = Object.entries(data.presets).map(([key, preset]) => ({
                    key: key,
                    display_name: preset.display_name,
                    aspect_ratio: preset.aspect_ratio,
                    width: preset.width,
                    height: preset.height,
                    purpose: preset.purpose
                }));

                // Set default selection if not already set
                if (data.default_preset && !this.selectedSize) {
                    this.selectedSize = data.default_preset;
                }

                // Update preview aspect ratio
                this.updatePreviewAspectRatio();

                console.log('Size presets loaded from API:', this.sizePresets.length, 'presets');
                
            } catch (error) {
                console.warn('Failed to load size presets from API:', error);
                // Use fallback presets (matches backend exactly) - no error logging for timeout
                this.sizePresets = [
                    { key: 'blog_header', display_name: 'Blog Header', aspect_ratio: '1200x630', width: 1200, height: 630, purpose: 'A wide blog header graphic (16:9 ratio)' },
                    { key: 'social_square', display_name: 'Social Post - Square', aspect_ratio: '1080x1080', width: 1080, height: 1080, purpose: 'A square social media post (1:1 ratio)' },
                    { key: 'social_portrait', display_name: 'Social Post - Portrait', aspect_ratio: '1080x1350', width: 1080, height: 1350, purpose: 'A vertical social media post (4:5 ratio)' },
                    { key: 'story', display_name: 'Instagram/TikTok Story', aspect_ratio: '1080x1920', width: 1080, height: 1920, purpose: 'A tall story for Instagram or TikTok (9:16 ratio)' },
                    { key: 'twitter_post', display_name: 'Twitter Post', aspect_ratio: '1600x900', width: 1600, height: 900, purpose: 'A wide image for a Twitter (X) post (16:9 ratio)' },
                    { key: 'presentation_slide', display_name: 'Presentation Slide', aspect_ratio: '1920x1080', width: 1920, height: 1080, purpose: 'A standard presentation slide (16:9 ratio)' },
                    { key: 'youtube_thumbnail', display_name: 'YouTube Thumbnail', aspect_ratio: '1280x720', width: 1280, height: 720, purpose: 'A thumbnail for a YouTube video (16:9 ratio)' }
                ];
                
                this.selectedSize = 'blog_header';
                
                // Update preview aspect ratio for fallback
                this.updatePreviewAspectRatio();
                
                // Continue API call in background to warm up server (don't await)
                apiCall.catch(() => {}); // Silently ignore errors for background warming
            }
        },

        // --- AUTHENTICATION METHODS --- //

        /**
         * Restore user session on app load
         */
        async restoreSession() {
            try {
                const userProfile = await this.authService.validateSession();
                if (userProfile) {
                    this.isLoggedIn = true;
                    this.currentUser = userProfile;
                    console.log('Session restored for user:', userProfile.email);
                } else {
                    this.isLoggedIn = false;
                    this.currentUser = null;
                }
            } catch (error) {
                console.warn('Failed to restore session:', error);
                this.isLoggedIn = false;
                this.currentUser = null;
            }
        },

        /**
         * Open authentication modal
         * @param {string} mode - 'login' or 'signup'
         */
        openAuthModal(mode = 'login') {
            this.authMode = mode;
            this.isAuthModalOpen = true;
            this.resetAuthForm();

            // Prevent body scroll when modal is open
            document.body.classList.add('body-no-scroll');

            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'auth_modal_open', {
                    event_category: 'Authentication',
                    event_label: mode
                });
            }
        },

        /**
         * Close authentication modal
         */
        closeAuthModal() {
            this.isAuthModalOpen = false;
            this.resetAuthForm();
            
            // Clear any error messages when modal is closed manually
            this.errorMessage = null;

            // Restore body scroll
            document.body.classList.remove('body-no-scroll');
        },

        /**
         * Toggle between login and signup modes
         */
        toggleAuthMode() {
            this.authMode = this.authMode === 'login' ? 'signup' : 'login';
            this.resetAuthForm();
        },

        /**
         * Reset authentication form
         */
        resetAuthForm() {
            this.authForm = {
                email: '',
                password: '',
                full_name: '',
                errorMessage: '',
                isLoading: false
            };
        },

        /**
         * Handle user login
         */
        async handleLogin() {
            if (this.authForm.isLoading) return;

            this.authForm.isLoading = true;
            this.authForm.errorMessage = '';

            try {
                const credentials = {
                    email: this.authForm.email.trim(),
                    password: this.authForm.password
                };

                const loginResponse = await this.authService.login(credentials);

                // Update app state
                this.isLoggedIn = true;
                this.currentUser = loginResponse.user;

                // Clear any existing error messages
                this.errorMessage = null;
                
                // Close modal and show success
                this.closeAuthModal();
                this.showSuccessMessage(`Welcome back, ${loginResponse.user.full_name || loginResponse.user.email}!`);

                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'login_success', {
                        event_category: 'Authentication',
                        event_label: 'email_login'
                    });
                }

            } catch (error) {
                this.authForm.errorMessage = this.formatAuthError(error);

                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'login_failure', {
                        event_category: 'Authentication',
                        event_label: error.message
                    });
                }
            } finally {
                this.authForm.isLoading = false;
            }
        },

        /**
         * Handle user signup
         */
        async handleSignup() {
            if (this.authForm.isLoading) return;

            // Basic validation
            if (this.authForm.password.length < 6) {
                this.authForm.errorMessage = 'Password must be at least 6 characters long.';
                return;
            }

            this.authForm.isLoading = true;
            this.authForm.errorMessage = '';

            try {
                const userData = {
                    email: this.authForm.email.trim(),
                    password: this.authForm.password,
                    full_name: this.authForm.full_name.trim() || undefined
                };

                await this.authService.register(userData);

                // Clear any existing error messages
                this.errorMessage = null;
                
                // Show success message and switch to login mode
                this.showSuccessMessage('Registration successful! Please check your email to confirm your account, then log in.');
                this.authMode = 'login';
                this.resetAuthForm();
                
                // Close the modal after a brief delay to let user see the success message
                setTimeout(() => {
                    this.closeAuthModal();
                }, 2000);

                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'signup_success', {
                        event_category: 'Authentication',
                        event_label: 'email_signup'
                    });
                }

            } catch (error) {
                this.authForm.errorMessage = this.formatAuthError(error);

                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'signup_failure', {
                        event_category: 'Authentication',
                        event_label: error.message
                    });
                }
            } finally {
                this.authForm.isLoading = false;
            }
        },

        /**
         * Handle user logout
         */
        handleLogout() {
            this.authService.logout();
            this.isLoggedIn = false;
            this.currentUser = null;

            this.showSuccessMessage('You have been logged out successfully.');

            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'logout', {
                    event_category: 'Authentication'
                });
            }
        },

        /**
         * Format authentication error messages
         */
        formatAuthError(error) {
            const message = error.message || error.toString();

            // Common error message improvements
            if (message.includes('Invalid email or password')) {
                return 'Invalid email or password. Please check your credentials and try again.';
            }

            if (message.includes('Email already registered') || message.includes('already be registered')) {
                return 'An account with this email already exists. Try logging in instead.';
            }

            if (message.includes('Invalid email format')) {
                return 'Please enter a valid email address.';
            }

            if (message.includes('timeout') || message.includes('NetworkError')) {
                return 'Connection failed. Please check your internet and try again.';
            }

            return message || 'An unexpected error occurred. Please try again.';
        },

        /**
         * Check if Pro model should be available for current user
         */
        canUseProModel() {
            if (this.isLoggedIn) {
                return true; // Logged-in users have unlimited Pro access
            }

            return !this.authService.hasUsedFreePro(); // Anonymous users get one free Pro
        },

        /**
         * Get Pro model availability message
         */
        getProModelMessage() {
            if (this.isLoggedIn) {
                return 'Unlimited Pro generations';
            }

            if (this.authService.hasUsedFreePro()) {
                return 'Sign up for unlimited Pro access';
            }

            return 'Sign up to unlock all features';
        },

        // --- MOBILE COLLAPSE SETUP --- //
        setupMobileCollapse() {
            // // Check if mobile screen size and collapse sections by default
            // const checkMobile = () => {
            //     const isMobile = window.innerWidth < 768;
            //     if (isMobile) {
            //         this.styleExpanded = false;
            //         this.qualityExpanded = false;
            //     } else {
            //         this.styleExpanded = true;
            //         this.qualityExpanded = true;
            //     }
            // };

            // checkMobile();
            // window.addEventListener('resize', checkMobile);
        },

        // --- NAVIGATION METHODS --- //
        showSection(section) {
            this.activeSection = section;
            this.mobileMenuOpen = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Track navigation events
            if (typeof gtag !== 'undefined') {
                gtag('event', 'navigate', {
                    event_category: 'Navigation',
                    event_label: section
                });
            }
        },

        dismissMvpBanner() {
            this.showMvpBanner = false;
            localStorage.setItem('layoutcraftMvpBannerDismissed', 'true');
        },


        useExamplePrompt() {
            // Pick a random example from the examples array
            const randomExample = this.examples[Math.floor(Math.random() * this.examples.length)];

            // Set the prompt
            this.prompt = randomExample.prompt;

            // Auto-select appropriate theme based on the example
            const themeMapping = {
                'Tech Blog Header': 'dark_neon_tech',
                'Summer Sale Post': 'vibrant_gradient_energy',
                'Luxury Background': 'minimal_luxury_space',
                'Product Launch': 'glassmorphism_premium',
                'Newsletter Header': 'editorial_magazine_layout',
                'Course Thumbnail': 'bold_geometric_solid'
            };

            // Auto-select appropriate size preset based on the example
            const sizeMapping = {
                'Tech Blog Header': 'blog_header',
                'Summer Sale Post': 'social_square',
                'Luxury Background': 'blog_header',
                'Product Launch': 'twitter_post',
                'Newsletter Header': 'blog_header',
                'Course Thumbnail': 'youtube_thumbnail'
            };

            this.selectedTheme = themeMapping[randomExample.title] || 'auto';
            this.selectedSize = sizeMapping[randomExample.title] || 'blog_header';
            this.updatePreviewAspectRatio();

            this.saveDraft();

            // Show the generator section
            this.showSection('generator');

            // Track example usage
            if (typeof gtag !== 'undefined') {
                gtag('event', 'use_empty_state_example', {
                    event_category: 'Engagement',
                    event_label: randomExample.title
                });
            }
        },
        // --- QUICK PROMPT HANDLING --- //
        useQuickPrompt(quickPrompt) {
            this.prompt = quickPrompt.prompt;

            // Auto-select the corresponding theme
            const themeMapping = {
                'tech blog header': 'dark_neon_tech',
                'summer sale post': 'vibrant_gradient_energy',
                'luxury background': 'minimal_luxury_space',
                'event banner': 'editorial_magazine_layout'
            };

            // Auto-select appropriate size preset based on the quick prompt
            const sizeMapping = {
                'tech blog header': 'blog_header',
                'summer sale post': 'social_square',
                'luxury background': 'blog_header',
                'event banner': 'twitter_post'
            };

            const promptKey = quickPrompt.title.toLowerCase();
            this.selectedTheme = themeMapping[promptKey] || 'auto';
            this.selectedSize = sizeMapping[promptKey] || 'blog_header';
            this.updatePreviewAspectRatio();

            this.saveDraft();

            // Track quick prompt usage
            if (typeof gtag !== 'undefined') {
                gtag('event', 'use_quick_prompt', {
                    event_category: 'Engagement',
                    event_label: quickPrompt.title
                });
            }
        },

        useExample(example) {
            this.prompt = example.prompt;
            this.showSection('generator');

            // Auto-select appropriate theme based on the example
            const themeMapping = {
                'Tech Blog Header': 'dark_neon_tech',
                'Summer Sale Post': 'vibrant_gradient_energy',
                'Luxury Background': 'minimal_luxury_space',
                'Product Launch': 'glassmorphism_premium',
                'Newsletter Header': 'editorial_magazine_layout',
                'Course Thumbnail': 'bold_geometric_solid'
            };

            // Auto-select appropriate size preset based on the example
            const sizeMapping = {
                'Tech Blog Header': 'blog_header',
                'Summer Sale Post': 'social_square',
                'Luxury Background': 'blog_header',
                'Product Launch': 'twitter_post',
                'Newsletter Header': 'blog_header',
                'Course Thumbnail': 'youtube_thumbnail'
            };

            this.selectedTheme = themeMapping[example.title] || 'auto';
            this.selectedSize = sizeMapping[example.title] || 'blog_header';
            this.updatePreviewAspectRatio();

            this.saveDraft();

            // Track example usage
            if (typeof gtag !== 'undefined') {
                gtag('event', 'use_example', {
                    event_category: 'Engagement',
                    event_label: example.title
                });
            }
        },

        // --- DRAFT MANAGEMENT --- //
        loadDraft() {
            try {
                const draft = localStorage.getItem('layoutcraft-mvp-draft');
                if (draft) {
                    const data = JSON.parse(draft);
                    // Validate draft data
                    if (data && typeof data === 'object') {
                        this.prompt = data.prompt || '';
                        this.selectedEngine = data.engine || 'pro';
                        this.selectedTheme = data.theme || 'auto';
                        this.selectedSize = data.size || 'blog_header';
                    }
                }
            } catch (error) {
                console.warn('Failed to load draft:', error);
                localStorage.removeItem('layoutcraft-mvp-draft');
            }
        },

        saveDraft() {
            try {
                const draft = {
                    prompt: this.prompt,
                    engine: this.selectedEngine,
                    theme: this.selectedTheme,
                    size: this.selectedSize,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('layoutcraft-mvp-draft', JSON.stringify(draft));
            } catch (error) {
                console.warn('Failed to save draft:', error);
            }
        },

        // --- KEYBOARD & EVENT HANDLERS --- //
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Enter to generate
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && this.activeSection === 'generator') {
                    e.preventDefault();
                    this.generateImage();
                }

                // Escape to close modals/menus
                if (e.key === 'Escape') {
                    this.errorMessage = null;
                    this.mobileMenuOpen = false;
                    if (this.isAuthModalOpen) {
                        this.closeAuthModal();
                    }
                }
            });
        },

        setupCleanupHandlers() {
            // Clean up blob URLs when page unloads
            window.addEventListener('beforeunload', () => {
                if (this.generatedImage) {
                    URL.revokeObjectURL(this.generatedImage);
                }
            });
        },

        setupResizeHandler() {
            // Handle window resize for responsive preview dimensions
            let resizeTimeout;
            window.addEventListener('resize', () => {
                // Debounce resize events
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // Force Alpine to re-evaluate the style bindings
                    this.$nextTick(() => {
                        // This will trigger re-calculation of preview dimensions
                        this.updatePreviewAspectRatio();
                    });
                }, 250);
            });
        },

        // --- RETRY LOGIC --- //
        updateRetryMessage() {
            if (this.failedAttempts >= 2) {
                if (this.prompt.length > 100) {
                    this.retryMessage = "Try simplifying your prompt and running again.";
                } else {
                    this.retryMessage = "Try adjusting your prompt and retrying.";
                }
            } else {
                this.retryMessage = '';
            }
        },

        clearRetryMessage() {
            this.failedAttempts = 0;
            this.retryMessage = '';
        },

        // --- LOADING ANIMATION --- //
        startLoadingAnimation() {
            const messages = this.selectedEngine === 'pro'
                ? [
                    'Initializing Pro AI engine',
                    'Analyzing design principles',
                    'Crafting high-quality elements',
                    'Optimizing composition',
                    'Applying professional polish',
                    'Final quality check'
                ]
                : [
                    'Firing up Fast AI',
                    'Processing your prompt',
                    'Assembling visual concepts',
                    'Rendering your design',
                    'Almost ready'
                ];

            let messageIndex = 0;
            this.loadingMessage = messages[messageIndex];

            this.loadingInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                this.loadingMessage = messages[messageIndex];
            }, this.selectedEngine === 'fast' ? 3000 : 4000);
        },

        stopLoadingAnimation() {
            if (this.loadingInterval) {
                clearInterval(this.loadingInterval);
                this.loadingInterval = null;
            }
            this.loadingMessage = 'Warming up the AI engine...';
        },

        startProgressSimulation() {
            const duration = this.selectedEngine === 'pro' ? 60000 : 30000; // 60s for pro, 30s for fast
            const interval = 100; // Update every 100ms
            const increment = (100 / duration) * interval;

            this.progressInterval = setInterval(() => {
                if (this.generationProgress < 95) { // Never reach 100% until actually complete
                    this.generationProgress += increment;
                    // Slow down as we approach the end
                    if (this.generationProgress > 80) {
                        this.generationProgress += increment * 0.3;
                    }
                }
            }, interval);
        },

        stopProgressSimulation() {
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
            this.generationProgress = 100; // Complete the progress bar
        },

        // --- ERROR HANDLING --- //
        formatErrorMessage(error) {
            const message = error.message || error.toString();

            // Network errors
            if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                return 'Unable to connect to our servers. Please check your internet connection and try again.';
            }

            // Timeout errors
            if (error.name === 'AbortError' || message.includes('timeout')) {
                return 'The request took too long and was cancelled. Our servers might be busy - please try again in a moment.';
            }

            // Rate limiting
            if (message.includes('429') || message.includes('rate limit')) {
                return 'Too many requests right now. Please wait a moment and try again.';
            }

            // Server errors
            if (message.includes('500') || message.includes('502') || message.includes('503')) {
                return 'Our servers are experiencing issues. Please try again in a few minutes.';
            }

            // Generic error with some context
            return `Something went wrong. Please try again. (${message})`;
        },

        // --- CORE GENERATION LOGIC --- //
        async generateImage() {
            // Validation checks
            if (!this.prompt.trim() || this.isGenerating) return;

            if (this.prompt.length < 10) {
                this.errorMessage = 'Please provide a more detailed description (at least 10 characters).';
                return;
            }

            if (this.prompt.length > this.PROMPT_MAX_LENGTH) {
                this.errorMessage = `Please shorten your prompt (maximum ${this.PROMPT_MAX_LENGTH} characters).`;
                return;
            }

            // Check Pro model availability for anonymous users
            if (!this.isLoggedIn && this.selectedEngine === 'pro' && !this.canUseProModel()) {
                this.errorMessage = 'You\'ve used your free Pro generation. Sign up for unlimited Pro access!';
                this.openAuthModal('signup');
                return;
            }

            // Reset state
            this.isGenerating = true;
            this.errorMessage = null;
            this.generatedImage = null;
            this.showEmailForm = false;
            this.imageLoaded = false;
            this.imageError = false;
            this.saveDraft();
            
            // Ensure preview aspect ratio is up to date for loading skeleton
            this.updatePreviewAspectRatio();
            
            this.startLoadingAnimation();
            this.isGenerating = true;
            this.generationProgress = 0;

            this.startProgressSimulation();

            if (window.innerWidth < 768) { // Checks for mobile screen width
                this.$nextTick(() => {
                    this.$refs.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }

            // Determine theme (random if auto)
            let themeToSend = this.selectedTheme;
            if (themeToSend === 'auto') {
                const randomTheme = this.themes[Math.floor(Math.random() * this.themes.length)];
                themeToSend = randomTheme.id;
            }
            console.log(`Generating image with theme: ${themeToSend}`);

            try {
                const generationData = {
                    prompt: this.prompt.trim(),
                    model: this.modelMapping[this.selectedEngine],
                    theme: themeToSend,
                    size_preset: this.selectedSize
                };

                const imageBlob = await this.authService.generateImage(generationData, this.isLoggedIn);
                console.log('Image generation response:', imageBlob);

                // Validate blob
                if (!imageBlob || imageBlob.size === 0) {
                    throw new Error('Received empty image data');
                }

                // Clean up previous image URL
                if (this.generatedImage) {
                    URL.revokeObjectURL(this.generatedImage);
                }

                this.generatedImage = URL.createObjectURL(imageBlob);
                this.filename = this.generateFilename();

                // Only show email form for anonymous users
                this.showEmailForm = !this.isLoggedIn;

                this.$nextTick(() => {
                    this.$refs.resultPanel.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                });

                // Clear retry message on success
                this.clearRetryMessage();

                // Show success message
                this.showSuccessMessage('Design generated successfully!');

                // Analytics - success
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'generate_success', {
                        event_category: 'Generation',
                        event_label: this.selectedEngine,
                        custom_parameters: {
                            theme: themeToSend,
                            size_preset: this.selectedSize,
                            prompt_length: this.prompt.length,
                            user_type: this.isLoggedIn ? 'authenticated' : 'anonymous'
                        }
                    });
                }

            } catch (error) {
                this.failedAttempts++;
                this.updateRetryMessage();
                this.errorMessage = this.formatErrorMessage(error);
                console.error('Generation failed:', error);

                // Analytics - failure
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'generate_failure', {
                        event_category: 'Generation',
                        event_label: error.name || 'Unknown',
                        custom_parameters: {
                            error_message: error.message || 'Unknown error',
                            attempt_number: this.failedAttempts,
                            user_type: this.isLoggedIn ? 'authenticated' : 'anonymous'
                        }
                    });
                }
            } finally {
                this.isGenerating = false;
                this.stopLoadingAnimation();
                this.stopProgressSimulation();
            }
        },

        // --- REGENERATION LOGIC --- //
        regenerateImage() {
            if (this.isGenerating) return;

            const originalPrompt = this.prompt;
            const variations = [
                ', with a fresh perspective',
                ', in an alternative style',
                ', with enhanced visual appeal',
                ', with a different color palette',
                ', with improved composition'
            ];

            // Add variation to prompt
            this.prompt = originalPrompt.split(',')[0] + variations[Math.floor(Math.random() * variations.length)];

            // Generate and restore original prompt
            this.generateImage().finally(() => {
                this.prompt = originalPrompt;
                this.saveDraft();
            });

            // Track regeneration
            if (typeof gtag !== 'undefined') {
                gtag('event', 'regenerate', {
                    event_category: 'Generation',
                    event_label: 'variation',
                    custom_parameters: {
                        user_type: this.isLoggedIn ? 'authenticated' : 'anonymous'
                    }
                });
            }
        },

        // --- UTILITY FUNCTIONS --- //
        generateFilename() {
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
            const promptSlug = this.prompt.slice(0, 30)
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 20);

            return `layoutcraft_${promptSlug}_${this.selectedTheme}_${timestamp}.png`;
        },

        // --- EMAIL SUBMISSION --- //
        async submitEmail() {
            if (!this.emailForUpdates.trim() || this.isSubmittingEmail) return;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.emailForUpdates.trim())) {
                this.errorMessage = 'Please enter a valid email address.';
                return;
            }

            // Prevent double-clicks
            this.isSubmittingEmail = true;

            // IMPORTANT: Grab the email before we clear the input field for the UI
            const emailToSubmit = this.emailForUpdates.trim();

            // --- 2. Assume Success Immediately (The "Forget" part) ---
            // This part now happens instantly without waiting for the server.
            this.emailForUpdates = '';
            this.emailSubmitted = true;
            this.showEmailForm = false;
            this.showSuccessMessage('Thanks for subscribing! We\'ll keep you updated.');

            // Fire analytics event immediately as well
            if (typeof gtag !== 'undefined') {
                gtag('event', 'email_signup', {
                    event_category: 'Engagement',
                    event_label: 'post_generation'
                });
            }

            // --- 3. Send API Request in the Background (The "Fire" part) ---
            // We send the request but don't use "await", so the function doesn't wait here.
            // The try/catch block is removed so errors are not shown to the user.
            fetch(`${this.API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailToSubmit,
                    message: "User signed up for updates from MVP after successful generation.",
                    source: "MVP Post-Generation Form",
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            })
                .then(response => {
                    if (!response.ok) {
                        // Log errors for your debugging, but the user will never see this.
                        console.error(`Feedback API failed silently with status: ${response.status}`);
                    }
                })
                .catch(error => {
                    // Also log network errors silently.
                    console.error('Feedback API network error (silenced from user):', error);
                });

            // The form is hidden, but we reset the state for logical consistency.
            this.isSubmittingEmail = false;
        },

        // --- STANDALONE FEEDBACK SUBMISSION --- //
        async submitStandaloneFeedback() {
            // --- 1. Validation (No changes here) ---
            if (!this.standaloneEmail.trim() || !this.standaloneFeedbackMessage.trim() || this.isSubmittingStandaloneFeedback) return;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.standaloneEmail.trim())) {
                this.errorMessage = 'Please enter a valid email address.';
                return;
            }

            // Prevent double-clicks
            this.isSubmittingStandaloneFeedback = true;

            // IMPORTANT: Grab the data before we clear the form fields for the UI
            const emailToSubmit = this.standaloneEmail.trim();
            const messageToSubmit = this.standaloneFeedbackMessage.trim();

            // --- 2. Assume Success Immediately (The "Forget" part) ---
            // This part now happens instantly without waiting for the server.
            this.standaloneEmail = '';
            this.standaloneFeedbackMessage = '';
            this.feedbackSubmitted = true;
            this.showSuccessMessage('Thank you for your feedback!');

            // Fire analytics event immediately
            if (typeof gtag !== 'undefined') {
                gtag('event', 'feedback_submission', {
                    event_category: 'Engagement',
                    event_label: 'standalone_form'
                });
            }

            // --- 3. Send API Request in the Background (The "Fire" part) ---
            // The request is sent without "await" so the UI isn't blocked.
            // Errors are logged silently to the console for debugging.
            fetch(`${this.API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailToSubmit,
                    message: messageToSubmit,
                    source: "MVP Standalone Feedback Form",
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            })
                .then(response => {
                    if (!response.ok) {
                        // Log errors for your debugging, the user will not see this.
                        console.error(`Standalone Feedback API failed silently with status: ${response.status}`);
                    }
                })
                .catch(error => {
                    // Also log network errors silently.
                    console.error('Standalone Feedback API network error (silenced from user):', error);
                });

            // Reset the submitting state for logical consistency.
            this.isSubmittingStandaloneFeedback = false;
        },

        // --- USER INTERACTION TRACKING --- //
        downloadImage() {
            if (this.generatedImage && typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    event_category: 'Engagement',
                    event_label: this.selectedEngine,
                    custom_parameters: {
                        theme: this.selectedTheme,
                        filename: this.filename,
                        user_type: this.isLoggedIn ? 'authenticated' : 'anonymous'
                    }
                });
            }
        },

        // --- UI FEEDBACK --- //
        showSuccessMessage(message) {
            this.successMessage = message;
            this.showSuccessToast = true;
            setTimeout(() => {
                this.showSuccessToast = false;
            }, 3000);
        },

        // --- REACTIVE WATCHERS --- //
        // These will automatically save drafts when values change
        $watch: {
            prompt() {
                this.saveDraft();
            },
            selectedEngine() {
                this.saveDraft();
            },
            selectedTheme() {
                this.saveDraft();
            },
            selectedSize() {
                this.saveDraft();
                
                // Update preview aspect ratio when size changes
                this.updatePreviewAspectRatio();
                
                // Track preset selection analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'preset_selected', {
                        event_category: 'Generation',
                        event_label: this.selectedSize,
                        custom_parameters: {
                            user_type: this.isLoggedIn ? 'authenticated' : 'anonymous'
                        }
                    });
                }
            }
        }
    }));
});

// --- GLOBAL ERROR HANDLING --- //
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (typeof gtag !== 'undefined') {
        gtag('event', 'javascript_error', {
            event_category: 'Error',
            event_label: event.error?.message || 'Unknown error'
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (typeof gtag !== 'undefined') {
        gtag('event', 'promise_rejection', {
            event_category: 'Error',
            event_label: event.reason?.message || 'Unknown rejection'
        });
    }
});