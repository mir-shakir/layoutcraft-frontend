// Optimized Tool JavaScript - No frameworks, pure performance
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
        sizePresets: [],
        styles: [
            { id: "glassmorphism_premium", name: "Glassmorphism", icon: "🌐" },
            { id: "bold_geometric_solid", name: "Bold Geometric", icon: "🔷" },
            { id: "textured_organic_patterns", name: "Organic", icon: "🌿" },
            { id: "minimal_luxury_space", name: "Minimal Luxury", icon: "✨" },
            { id: "vibrant_gradient_energy", name: "Vibrant Gradient", icon: "🌈" },
            { id: "dark_neon_tech", name: "Neon Tech", icon: "💻" },
            { id: "editorial_magazine_layout", name: "Editorial", icon: "📰" }
        ]
    };
    
    // API Configuration
    const API_BASE_URL = 'https://layoutcraft-backend.onrender.com';
    
    // DOM Elements
    const elements = {
        prompt: null,
        charCount: null,
        sizeGrid: null,
        styleGrid: null,
        generateBtn: null,
        qualityBtns: null,
        quickBtns: null,
        states: {
            empty: null,
            loading: null,
            result: null,
            error: null
        }
    };
    
    // Initialize
    function init() {
        cacheDOMElements();
        loadSizePresets();
        setupEventListeners();
        checkAuthStatus();
        checkURLParams();
        updateGenerateButton();
    }
    
    function cacheDOMElements() {
        elements.prompt = document.getElementById('prompt');
        elements.charCount = document.getElementById('char-count');
        elements.sizeGrid = document.getElementById('size-grid');
        elements.styleGrid = document.getElementById('style-grid');
        elements.generateBtn = document.getElementById('generate-btn');
        elements.qualityBtns = document.querySelectorAll('.quality-btn');
        elements.quickBtns = document.querySelectorAll('.quick-btn');
        
        elements.states.empty = document.getElementById('empty-state');
        elements.states.loading = document.getElementById('loading-state');
        elements.states.result = document.getElementById('result-state');
        elements.states.error = document.getElementById('error-state');
    }
    
    function setupEventListeners() {
        // Prompt input
        elements.prompt.addEventListener('input', handlePromptInput);
        
        // Quick prompts
        elements.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.prompt.value = btn.dataset.prompt;
                handlePromptInput();
            });
        });
        
        // Quality buttons
        elements.qualityBtns.forEach(btn => {
            btn.addEventListener('click', () => handleQualitySelect(btn.dataset.quality));
        });
        
        // Generate button
        elements.generateBtn.addEventListener('click', generateDesign);
        
        // Result actions
        document.getElementById('download-btn')?.addEventListener('click', downloadImage);
        document.getElementById('regenerate-btn')?.addEventListener('click', regenerateDesign);
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            showState('empty');
            elements.generateBtn.disabled = false;
        });
    }
    
    function handlePromptInput() {
        const length = elements.prompt.value.length;
        state.prompt = elements.prompt.value;
        
        // Update character count
        elements.charCount.textContent = `${length}/500`;
        elements.charCount.classList.toggle('over-limit', length > 500);
        
        // Update generate button
        updateGenerateButton();
    }
    
    function updateGenerateButton() {
        const isValid = state.prompt.trim().length >= 10 && 
                       state.prompt.length <= 500 && 
                       !state.isGenerating;
        
        elements.generateBtn.disabled = !isValid;
    }
    
    async function loadSizePresets() {
        try {
            // Try to load from API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            
            const response = await fetch(`${API_BASE_URL}/api/presets`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                state.sizePresets = Object.entries(data.presets).map(([key, preset]) => ({
                    key,
                    ...preset
                }));
            } else {
                throw new Error('Failed to load presets');
            }
        } catch (error) {
            // Use fallback presets
            state.sizePresets = [
                { key: 'blog_header', display_name: 'Blog Header', aspect_ratio: '1200x630' },
                { key: 'social_square', display_name: 'Social Square', aspect_ratio: '1080x1080' },
                { key: 'social_portrait', display_name: 'Social Portrait', aspect_ratio: '1080x1350' },
                { key: 'story', display_name: 'Story', aspect_ratio: '1080x1920' },
                { key: 'twitter_post', display_name: 'Twitter Post', aspect_ratio: '1600x900' },
                { key: 'presentation_slide', display_name: 'Presentation', aspect_ratio: '1920x1080' },
                { key: 'youtube_thumbnail', display_name: 'YouTube', aspect_ratio: '1280x720' }
            ];
        }
        
        renderSizeButtons();
        renderStyleButtons();
    }
    
    function renderSizeButtons() {
        elements.sizeGrid.innerHTML = state.sizePresets.map(preset => `
            <button class="size-btn ${preset.key === state.selectedSize ? 'active' : ''}" 
                   data-size="${preset.key}">
               <span class="size-name">${preset.display_name}</span>
               <span class="size-dimensions">${preset.aspect_ratio}</span>
           </button>
       `).join('');
       
       // Add event listeners
       elements.sizeGrid.querySelectorAll('.size-btn').forEach(btn => {
           btn.addEventListener('click', () => {
               state.selectedSize = btn.dataset.size;
               elements.sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
               btn.classList.add('active');
           });
       });
   }
   
   function renderStyleButtons() {
       const styleHTML = state.styles.map(style => `
           <button class="style-btn ${style.id === state.selectedStyle ? 'active' : ''}" 
                   data-style="${style.id}">
               <span class="style-icon">${style.icon}</span>
               <span>${style.name.replace(/_/g, ' ')}</span>
           </button>
       `).join('');
       
       // Add to existing auto button
       elements.styleGrid.innerHTML += styleHTML;
       
       // Add event listeners
       elements.styleGrid.querySelectorAll('.style-btn').forEach(btn => {
           btn.addEventListener('click', () => {
               state.selectedStyle = btn.dataset.style;
               elements.styleGrid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
               btn.classList.add('active');
           });
       });
   }
   
   function checkAuthStatus() {
       // Check if user is logged in
       const token = localStorage.getItem('layoutcraft_access_token');
       state.isLoggedIn = !!token;
       
       // Check if free Pro has been used
       state.hasUsedFreePro = localStorage.getItem('layoutcraft_pro_used') === 'true';
       
       updateProStatus();
   }
   
   function updateProStatus() {
       const proBtn = document.querySelector('[data-quality="pro"]');
       const proOverlay = document.getElementById('pro-overlay');
       const statusEl = document.getElementById('quality-status');
       
       if (state.isLoggedIn) {
           proOverlay.style.display = 'none';
           statusEl.textContent = 'Unlimited Pro generations';
           statusEl.className = 'quality-status pro-available';
       } else if (!state.hasUsedFreePro) {
           proOverlay.style.display = 'none';
           statusEl.textContent = '1 free Pro generation available';
           statusEl.className = 'quality-status pro-limited';
       } else {
           proOverlay.style.display = 'flex';
           statusEl.textContent = 'Sign up for unlimited Pro access';
           statusEl.className = 'quality-status';
       }
   }
   
   function handleQualitySelect(quality) {
       if (quality === 'pro' && !state.isLoggedIn && state.hasUsedFreePro) {
           // Open auth modal for signup
           if (window.layoutCraftNav) {
               window.layoutCraftNav.openAuthModal('signup');
           }
           return;
       }
       
       state.selectedQuality = quality;
       elements.qualityBtns.forEach(btn => {
           btn.classList.toggle('active', btn.dataset.quality === quality);
       });
   }
   
   function checkURLParams() {
       const params = new URLSearchParams(window.location.search);
       const promptParam = params.get('prompt');
       
       if (promptParam) {
           elements.prompt.value = decodeURIComponent(promptParam);
           handlePromptInput();
           
           // Clean URL
           window.history.replaceState({}, document.title, '/app/');
           
           // Track conversion
           if (typeof gtag !== 'undefined') {
               gtag('event', 'homepage_to_app_conversion', {
                   event_category: 'Conversion',
                   event_label: 'with_prompt'
               });
           }
       }
   }
   
   function showState(stateName) {
       Object.keys(elements.states).forEach(key => {
           elements.states[key].style.display = key === stateName ? 'block' : 'none';
       });
   }
   
   async function generateDesign() {
       if (state.isGenerating || !state.prompt.trim()) return;
       
       state.isGenerating = true;
       elements.generateBtn.disabled = true;
       
       // Update button state
       elements.generateBtn.querySelector('.btn-text').style.display = 'none';
       elements.generateBtn.querySelector('.btn-loading').style.display = 'flex';
       
       // Show loading state
       showState('loading');
       
       // Start progress animation
       startProgressAnimation();
       
       // Prepare request data
       const requestData = {
           prompt: state.prompt.trim(),
           model: state.selectedQuality === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
           theme: state.selectedStyle === 'auto' ? 
               state.styles[Math.floor(Math.random() * state.styles.length)].id : 
               state.selectedStyle,
           size_preset: state.selectedSize
       };
       
       try {
           // Determine endpoint based on auth status
           const endpoint = state.isLoggedIn ? 
               `${API_BASE_URL}/api/v1/generate` : 
               `${API_BASE_URL}/api/generate`;
           
           const headers = {
               'Content-Type': 'application/json'
           };
           
           // Add auth header if logged in
           if (state.isLoggedIn) {
               const token = localStorage.getItem('layoutcraft_access_token');
               headers['Authorization'] = `Bearer ${token}`;
           }
           
           // Mark Pro as used for anonymous users
           if (!state.isLoggedIn && state.selectedQuality === 'pro') {
               localStorage.setItem('layoutcraft_pro_used', 'true');
               state.hasUsedFreePro = true;
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
           
           // Show result
           showResult(imageUrl);
           
           // Track success
           if (typeof gtag !== 'undefined') {
               gtag('event', 'generate_success', {
                   event_category: 'Generation',
                   event_label: state.selectedQuality,
                   custom_parameters: {
                       theme: requestData.theme,
                       size_preset: state.selectedSize
                   }
               });
           }
           
       } catch (error) {
           console.error('Generation failed:', error);
           showError(error.message);
           
           // Track error
           if (typeof gtag !== 'undefined') {
               gtag('event', 'generate_failure', {
                   event_category: 'Generation',
                   event_label: error.message
               });
           }
       } finally {
           state.isGenerating = false;
           elements.generateBtn.disabled = false;
           elements.generateBtn.querySelector('.btn-text').style.display = 'block';
           elements.generateBtn.querySelector('.btn-loading').style.display = 'none';
           stopProgressAnimation();
           updateProStatus();
       }
   }
   
   function showResult(imageUrl) {
       const img = document.getElementById('result-image');
       img.src = imageUrl;
       img.onload = () => {
           showState('result');
       };
       
       // Store for download
       img.dataset.filename = generateFilename();
   }
   
   function showError(message) {
       document.getElementById('error-message').textContent = 
           message || 'Something went wrong. Please try again.';
       showState('error');
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
       const img = document.getElementById('result-image');
       const a = document.createElement('a');
       a.href = img.src;
       a.download = img.dataset.filename || 'layoutcraft_design.png';
       a.click();
       
       // Track download
       if (typeof gtag !== 'undefined') {
           gtag('event', 'download', {
               event_category: 'Engagement',
               event_label: state.selectedQuality
           });
       }
   }
   
   function regenerateDesign() {
       // Add variation to prompt
       const variations = [
           ', with a fresh perspective',
           ', in an alternative style',
           ', with enhanced visual appeal',
           ', with a different color palette',
           ', with improved composition'
       ];
       
       const originalPrompt = state.prompt;
       state.prompt = originalPrompt.split(',')[0] + 
           variations[Math.floor(Math.random() * variations.length)];
       
       generateDesign().then(() => {
           state.prompt = originalPrompt;
           elements.prompt.value = originalPrompt;
       });
   }
   
   let progressInterval;
   function startProgressAnimation() {
       const progressFill = document.getElementById('progress-fill');
       const loadingMessage = document.getElementById('loading-message');
       const loadingSubtitle = document.getElementById('loading-subtitle');
       
       let progress = 0;
       const duration = state.selectedQuality === 'pro' ? 60000 : 30000;
       const messages = state.selectedQuality === 'pro' ? [
           'Initializing Pro AI engine...',
           'Analyzing design principles...',
           'Crafting high-quality elements...',
           'Optimizing composition...',
           'Applying professional polish...',
           'Final quality check...'
       ] : [
           'Firing up Fast AI...',
           'Processing your prompt...',
           'Assembling visual concepts...',
           'Rendering your design...',
           'Almost ready...'
       ];
       
       loadingSubtitle.textContent = state.selectedQuality === 'pro' ? 
           'This can take up to 60 seconds for Pro quality.' : 
           'Fast generation in progress...';
       
       let messageIndex = 0;
       const messageInterval = duration / messages.length;
       
       progressInterval = setInterval(() => {
           progress = Math.min(progress + (100 / (duration / 100)), 95);
           progressFill.style.width = `${progress}%`;
           
           const currentMessageIndex = Math.floor(progress / (100 / messages.length));
           if (currentMessageIndex !== messageIndex && currentMessageIndex < messages.length) {
               messageIndex = currentMessageIndex;
               loadingMessage.textContent = messages[messageIndex];
           }
       }, 100);
   }
   
   function stopProgressAnimation() {
       if (progressInterval) {
           clearInterval(progressInterval);
           document.getElementById('progress-fill').style.width = '100%';
       }
   }
   
   // Initialize when DOM is ready
   if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', init);
   } else {
       init();
   }
})();