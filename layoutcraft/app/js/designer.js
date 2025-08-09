// Designer Interface JavaScript
(function() {
    'use strict';
    
    // App State
    const state = {
        prompt: '',
        selectedSize: 'blog_header',
        selectedStyle: 'auto',
        selectedQuality: 'pro',
        isGenerating: false,
        isLoggedIn: false,
        hasUsedFreePro: false,
        currentImage: null,
        sizePresets: {
            blog_header: { name: 'Blog Header', ratio: '1200x630' },
            social_square: { name: 'Social Square', ratio: '1080x1080' },
            social_portrait: { name: 'Social Portrait', ratio: '1080x1350' },
            story: { name: 'Story', ratio: '1080x1920' },
            twitter_post: { name: 'Twitter Post', ratio: '1600x900' },
            youtube_thumbnail: { name: 'YouTube', ratio: '1280x720' },
            presentation_slide: { name: 'Presentation', ratio: '1920x1080' }
        }
    };
    
    // API Configuration
    const API_BASE_URL = 'https://layoutcraft-backend.onrender.com';
    
    // Loading messages
    const loadingMessages = {
        fast: [
            'Firing up the AI engine...',
            'Analyzing your prompt...',
            'Creating visual elements...',
            'Applying design principles...',
            'Finalizing your design...'
        ],
        pro: [
            'Initializing Pro AI Designer...',
            'Deep analysis of requirements...',
            'Crafting premium elements...',
            'Optimizing visual hierarchy...',
            'Applying professional polish...',
            'Quality assurance check...'
        ]
    };
    
    const loadingTips = [
        'Pro tip: Be specific about colors and text',
        'Pro tip: Mention the mood you want to create',
        'Pro tip: Include any text that should appear',
        'Pro tip: Describe the style you prefer',
        'Pro tip: Add details about your target audience'
    ];
    
    // Initialize
    function init() {
        setupEventListeners();
        checkAuthStatus();
        checkURLParams();
        updateUI();
    }
    
function setupEventListeners() {
    // Prompt input - handle both desktop and mobile
    const promptInput = document.getElementById('prompt-input');
    const mobilePromptInput = document.getElementById('prompt-input-mobile');
    
    if (promptInput) {
        promptInput.addEventListener('input', handlePromptInput);
    }
    if (mobilePromptInput) {
        mobilePromptInput.addEventListener('input', handleMobilePromptInput);
    }
    
    // Template cards
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => selectTemplate(card.dataset.size));
    });
    
    // Style pills
    document.querySelectorAll('.style-pill').forEach(pill => {
        pill.addEventListener('click', () => selectStyle(pill.dataset.style));
    });
    
    
    // Quick chips event listeners (both desktop and mobile)
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const promptInput = document.getElementById('prompt-input');
            const mobilePromptInput = document.getElementById('prompt-input-mobile');
            
            // Update both inputs
            if (promptInput) promptInput.value = chip.dataset.prompt;
            if (mobilePromptInput) mobilePromptInput.value = chip.dataset.prompt;
            
            state.prompt = chip.dataset.prompt;
            
            // Auto-select style and template from data attributes
            if (chip.dataset.style) {
                selectStyle(chip.dataset.style);
            }
            if (chip.dataset.template) {
                selectTemplate(chip.dataset.template);
            }
            
            // Update UI
            updateUI();
            
            // Update character count for both
            const indicator = document.querySelector('.char-indicator');
            const mobileIndicator = document.getElementById('char-indicator-mobile');
            
            if (indicator) indicator.textContent = `${state.prompt.length}/500`;
            if (mobileIndicator) mobileIndicator.textContent = `${state.prompt.length}/500`;
            
            // Focus on appropriate input based on screen size
            if (window.innerWidth <= 768 && mobilePromptInput) {
                mobilePromptInput.focus();
            } else if (promptInput) {
                promptInput.focus();
            }
        });
    });
        
        // Quality radio buttons - both desktop and mobile
        document.querySelectorAll('.quality-radio').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    selectQuality(radio.value);
                    // Sync between desktop and mobile
                    syncQualitySelection(radio.value);
                }
            });
        });
        
        // Generate buttons - both desktop and mobile
        const generateBtn = document.getElementById('generate-btn');
        const mobileGenerateBtn = document.getElementById('generate-btn-mobile');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', generateDesign);
        }
        if (mobileGenerateBtn) {
            mobileGenerateBtn.addEventListener('click', generateDesign);
        }
        
        // Result actions
        document.getElementById('download-btn').addEventListener('click', downloadImage);
        document.getElementById('regenerate-btn').addEventListener('click', regenerateDesign);
        document.getElementById('retry-btn').addEventListener('click', () => {
            showCanvas('empty');
            updateUI();
        });
    }
    
function handlePromptInput() {
    const input = document.getElementById('prompt-input');
    if (!input) return;
    
    const length = input.value.length;
    state.prompt = input.value;
    
    // Sync with mobile input
    const mobileInput = document.getElementById('prompt-input-mobile');
    if (mobileInput && mobileInput.value !== input.value) {
        mobileInput.value = input.value;
    }
    
    // Auto-adjust textarea height with minimum 4 lines (120px)
    input.style.height = 'auto';
    const newHeight = Math.max(120, input.scrollHeight);
    input.style.height = newHeight + 'px';
    
    // Update character count
    const indicator = document.querySelector('.char-indicator');
    if (indicator) {
        indicator.textContent = `${length}/500`;
        indicator.style.color = length > 500 ? '#dc2626' : '#9ca3af';
    }
    
    updateUI();
}

function handleMobilePromptInput() {
    const input = document.getElementById('prompt-input-mobile');
    if (!input) return;
    
    const length = input.value.length;
    state.prompt = input.value;
    
    // Sync with desktop input
    const desktopInput = document.getElementById('prompt-input');
    if (desktopInput && desktopInput.value !== input.value) {
        desktopInput.value = input.value;
    }
    
    // Auto-adjust textarea height with minimum 80px
    input.style.height = 'auto';
    const newHeight = Math.max(80, input.scrollHeight);
    input.style.height = newHeight + 'px';
    
    // Update character count
    const indicator = document.getElementById('char-indicator-mobile');
    if (indicator) {
        indicator.textContent = `${length}/500`;
        indicator.style.color = length > 500 ? '#dc2626' : '#9ca3af';
    }
    
    updateUI();
}

function syncQualitySelection(quality) {
    // Update both desktop and mobile radio buttons
    const desktopRadio = document.getElementById(`quality-${quality}`);
    const mobileRadio = document.getElementById(`quality-${quality}-mobile`);
    
    if (desktopRadio) desktopRadio.checked = true;
    if (mobileRadio) mobileRadio.checked = true;
}
    
    function selectTemplate(size) {
        state.selectedSize = size;
        
        // Update UI
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.toggle('active', card.dataset.size === size);
        });
    }
    
    function selectStyle(style) {
        state.selectedStyle = style;
        
        // Update UI
        document.querySelectorAll('.style-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.style === style);
        });
    }
    
    function selectQuality(quality) {
        // Check if pro is available
        if (quality === 'pro' && !state.isLoggedIn && state.hasUsedFreePro) {
            if (window.layoutCraftNav) {
                window.layoutCraftNav.openAuthModal('signup');
            }
            // Reset to fast
            document.getElementById('quality-fast').checked = true;
            return;
        }
        
        state.selectedQuality = quality;
        
        // Update radio buttons
        const radioButton = document.getElementById(`quality-${quality}`);
        if (radioButton) {
            radioButton.checked = true;
        }
    }
    
    function checkAuthStatus() {
        const token = localStorage.getItem('layoutcraft_access_token');
        state.isLoggedIn = !!token;
        state.hasUsedFreePro = localStorage.getItem('layoutcraft_pro_used') === 'true';
        
        updateProBadge();
    }
    
    function updateProBadge() {
        const badge = document.getElementById('pro-badge');
        const mobileBadge = document.getElementById('pro-badge-mobile');
        
        // Update desktop badge
        if (badge) {
            if (state.isLoggedIn) {
                badge.classList.add('available');
                badge.title = 'Unlimited Pro access';
            } else if (!state.hasUsedFreePro) {
                badge.classList.add('available');
                badge.title = '1 free Pro generation';
            } else {
                badge.classList.remove('available');
            }
        }
        
        // Update mobile badge
        if (mobileBadge) {
            if (state.isLoggedIn) {
                mobileBadge.classList.add('available');
                mobileBadge.title = 'Unlimited Pro access';
            } else if (!state.hasUsedFreePro) {
                mobileBadge.classList.add('available');
                mobileBadge.title = '1 free Pro generation';
            } else {
                mobileBadge.classList.remove('available');
            }
        }
    }
    
    function checkURLParams() {
        const params = new URLSearchParams(window.location.search);
        const promptParam = params.get('prompt');
        const styleParam = params.get('style');
        const templateParam = params.get('template');
        
        if (promptParam) {
            const input = document.getElementById('prompt-input');
            const mobileInput = document.getElementById('prompt-input-mobile');
            const decodedPrompt = decodeURIComponent(promptParam);
            
            if (input) input.value = decodedPrompt;
            if (mobileInput) mobileInput.value = decodedPrompt;
            state.prompt = decodedPrompt;
            
            // Use explicit URL params first
            if (styleParam) {
                selectStyle(styleParam);
                console.log('Style set from URL param:', styleParam);
            }
            if (templateParam) {
                selectTemplate(templateParam);
                console.log('Template set from URL param:', templateParam);
            }
            
            // Auto-select template and style based on prompt content if not explicitly provided
            if (!styleParam || !templateParam) {
                const prompt = decodedPrompt.toLowerCase();
                console.log('Homepage prompt received:', prompt);
                
                if (prompt.includes('tech') || prompt.includes('ai') || prompt.includes('blog header')) {
                    if (!templateParam) selectTemplate('blog_header');
                    if (!styleParam) selectStyle('dark_neon_tech');
                    console.log('Auto-selected tech theme from homepage');
                } else if (prompt.includes('sale') || prompt.includes('summer') || prompt.includes('social media') || prompt.includes('instagram')) {
                    if (!templateParam) selectTemplate('social_square');
                    if (!styleParam) selectStyle('vibrant_gradient_energy');
                    console.log('Auto-selected sale theme from homepage');
                } else if (prompt.includes('linkedin') || prompt.includes('professional') || prompt.includes('banner')) {
                    if (!templateParam) selectTemplate('blog_header');
                    if (!styleParam) selectStyle('minimal_luxury_space');
                    console.log('Auto-selected professional theme from homepage');
                }
            }
            
            // Update character count for both desktop and mobile
            const indicator = document.querySelector('.char-indicator');
            const mobileIndicator = document.getElementById('char-indicator-mobile');
            
            if (indicator) indicator.textContent = `${decodedPrompt.length}/500`;
            if (mobileIndicator) mobileIndicator.textContent = `${decodedPrompt.length}/500`;
            
            // Clean URL
            window.history.replaceState({}, document.title, '/app/');
            
            updateUI();
        }
    }
    
    function updateUI() {
        const generateBtn = document.getElementById('generate-btn');
        const mobileGenerateBtn = document.getElementById('generate-btn-mobile');
        const isValid = state.prompt.trim().length >= 10 && 
                       state.prompt.length <= 500 && 
                       !state.isGenerating;
        
        if (generateBtn) generateBtn.disabled = !isValid;
        if (mobileGenerateBtn) mobileGenerateBtn.disabled = !isValid;
    }
    
    function showCanvas(state) {
        document.querySelectorAll('.canvas-state').forEach(canvas => {
            canvas.style.display = 'none';
        });
        
        const target = document.getElementById(`${state}-canvas`);
        if (target) {
            target.style.display = 'block';
        }
    }
    
    async function generateDesign() {
        if (state.isGenerating || !state.prompt.trim()) return;
        
        state.isGenerating = true;
        
        // Auto-scroll to canvas area smoothly (mobile only)
        const canvasElement = document.querySelector('.designer-canvas');
        if (canvasElement && window.innerWidth <= 768) {
            canvasElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
        
        // Update buttons
        const generateBtn = document.getElementById('generate-btn');
        const mobileGenerateBtn = document.getElementById('generate-btn-mobile');
        
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.classList.add('loading');
        }
        if (mobileGenerateBtn) {
            mobileGenerateBtn.disabled = true;
            mobileGenerateBtn.classList.add('loading');
        }
        
        // Show loading
        showCanvas('loading');
        startLoadingAnimation();
        
        // Prepare request
        const requestData = {
            prompt: state.prompt.trim(),
            model: state.selectedQuality === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
            theme: state.selectedStyle,
            size_preset: state.selectedSize
        };
        
        // If auto style, pick random
        if (requestData.theme === 'auto') {
            const styles = [
                'glassmorphism_premium',
                'bold_geometric_solid', 
                'textured_organic_patterns',
                'minimal_luxury_space', 
                'vibrant_gradient_energy', 
                'dark_neon_tech', 
                'editorial_magazine_layout'
            ];
            requestData.theme = styles[Math.floor(Math.random() * styles.length)];
        }
        
        try {
            // Mark Pro as used if needed
            if (!state.isLoggedIn && state.selectedQuality === 'pro') {
                localStorage.setItem('layoutcraft_pro_used', 'true');
                state.hasUsedFreePro = true;
            }
            
            // Determine endpoint
            const endpoint = state.isLoggedIn ? 
                `${API_BASE_URL}/api/v1/generate` : 
                `${API_BASE_URL}/api/generate`;
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (state.isLoggedIn) {
                const token = localStorage.getItem('layoutcraft_access_token');
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status}`);
            }
            
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Store current image
            state.currentImage = {
                url: imageUrl,
                filename: generateFilename()
            };
            
            // Show result
            showResult();
            
            // Track success
            if (typeof gtag !== 'undefined') {
                gtag('event', 'generate_success', {
                    event_category: 'Generation',
                    event_label: state.selectedQuality
                });
            }
            
        } catch (error) {
            console.error('Generation failed:', error);
            showError(error.message);
        } finally {
            state.isGenerating = false;
            
            const generateBtn = document.getElementById('generate-btn');
            const mobileGenerateBtn = document.getElementById('generate-btn-mobile');
            
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.classList.remove('loading');
            }
            if (mobileGenerateBtn) {
                mobileGenerateBtn.disabled = false;
                mobileGenerateBtn.classList.remove('loading');
            }
            
            stopLoadingAnimation();
            updateProBadge();
            updateUI();
        }
    }
    
    function showResult() {
        const img = document.getElementById('result-image');
        img.src = state.currentImage.url;
        img.onload = () => {
            showCanvas('result');
            
            // Auto-scroll to result image smoothly (mobile only)
            setTimeout(() => {
                const resultCanvas = document.getElementById('result-canvas');
                if (resultCanvas && window.innerWidth <= 768) {
                    resultCanvas.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 100);
        };
    }
    
    function showError(message) {
        document.getElementById('error-message').textContent = 
            message || 'Unable to generate your design. Please try again.';
        showCanvas('error');
    }
    
    function generateFilename() {
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        const promptSlug = state.prompt.slice(0, 30)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 20);
        
        return `layoutcraft_${promptSlug}_${timestamp}.png`;
    }
    
    function downloadImage() {
        if (!state.currentImage) return;
        
        const a = document.createElement('a');
        a.href = state.currentImage.url;
        a.download = state.currentImage.filename;
        a.click();
        
        // Track
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                event_category: 'Engagement',
                event_label: state.selectedQuality
            });
        }
    }
    
    function regenerateDesign() {
        // Add variation
        const variations = [
            ', with a fresh approach',
            ', alternative composition',
            ', different color scheme',
            ', enhanced visual appeal',
            ', refined details'
        ];
        
        const originalPrompt = state.prompt;
        state.prompt = originalPrompt.split(',')[0] + 
            variations[Math.floor(Math.random() * variations.length)];
        
        generateDesign().then(() => {
            state.prompt = originalPrompt;
            document.getElementById('prompt-input').value = originalPrompt;
        });
    }
    
    let progressInterval;
    let messageInterval;
    
    function startLoadingAnimation() {
        const progressBar = document.getElementById('progress-bar');
        const loadingMessage = document.getElementById('loading-message');
        const loadingTip = document.getElementById('loading-tip');
        
        // Reset
        let progress = 0;
        progressBar.style.width = '0%';
        
        // Messages
        const messages = loadingMessages[state.selectedQuality];
        let messageIndex = 0;
        
        // Update message
        loadingMessage.textContent = messages[0];
        
        // Random tip
        loadingTip.textContent = loadingTips[Math.floor(Math.random() * loadingTips.length)];
        
        // Progress animation
        const duration = state.selectedQuality === 'pro' ? 60000 : 30000;
        progressInterval = setInterval(() => {
            progress = Math.min(progress + (100 / (duration / 100)), 95);
            progressBar.style.width = `${progress}%`;
        }, 100);
        
        // Message rotation
        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            loadingMessage.textContent = messages[messageIndex];
        }, duration / messages.length);
    }
    
    function stopLoadingAnimation() {
        if (progressInterval) {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
            document.getElementById('progress-bar').style.width = '100%';
        }
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();