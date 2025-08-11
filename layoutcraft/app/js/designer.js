

import { authService } from "../../shared/js/authService.js";

(function() {
    'use strict';

    // --- STATE MANAGEMENT ---
    // A single object to hold the entire state of the application.
    const state = {
    // --- Core Properties ---
    appMode: 'generating', // Can be 'generating' or 'editing'
    currentGeneration: null, // Will hold the full generation object after a successful creation/edit
    prompt: '',
    selectedSize: 'blog_header',
    selectedStyle: 'auto',
    selectedQuality: 'pro',
    isGenerating: false, // Tracks if an API call is in progress
    currentImage: null,
    anonymousGenerationsRemaining: 3,

    // --- Legacy Properties (can be removed if not used elsewhere) ---
    isLoggedIn: false,
    hasUsedFreePro: false,
    errorMessage: null,
    failedAttempts: 0,
};
    // --- CONFIGURATION ---
    const PROMPT_MAX_LENGTH = 500;


    // --- DOM ELEMENT CACHE ---
    // Caching elements for performance to avoid repeated DOM queries.
    const elements = {
        promptInput: document.getElementById('prompt-input'),
        mobilePromptInput: document.getElementById('prompt-input-mobile'),
        charIndicator: document.querySelector('.designer-toolbar .char-indicator'),
        mobileCharIndicator: document.getElementById('char-indicator-mobile'),
        generateBtn: document.getElementById('generate-btn'),
        mobileGenerateBtn: document.getElementById('generate-btn-mobile'),
        canvasStates: {
            empty: document.getElementById('empty-canvas'),
            loading: document.getElementById('loading-canvas'),
            result: document.getElementById('result-canvas'),
            error: document.getElementById('error-canvas'),
        },
        resultImage: document.getElementById('result-image'),
        errorMessageText: document.getElementById('error-message'),
        loadingMessageText: document.getElementById('loading-message'),
        loadingTipText: document.getElementById('loading-tip'),
        progressBar: document.getElementById('progress-bar'),
    };

    // --- INITIALIZATION ---
    function init() {
        setupEventListeners();
        checkAuthStatus();
        checkSessionForPrompt();
        loadDraft();
        renderUI();
        setupKeyboardShortcuts();
        checkUrlForEdit();
        console.log("LayoutCraft Designer Initialized");
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        if (elements.promptInput) elements.promptInput.addEventListener('input', handlePromptInput);
        if (elements.mobilePromptInput) elements.mobilePromptInput.addEventListener('input', handleMobilePromptInput);
        if (elements.generateBtn) elements.generateBtn.addEventListener('click', generateDesign);
        if (elements.mobileGenerateBtn) elements.mobileGenerateBtn.addEventListener('click', generateDesign);

        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => selectTemplate(card.dataset.size));
        });

        document.querySelectorAll('.style-pill').forEach(pill => {
            pill.addEventListener('click', () => selectStyle(pill.dataset.style));
        });

        document.querySelectorAll('.quick-chip').forEach(chip => {
            chip.addEventListener('click', () => useQuickChip(chip.dataset));
        });

        document.querySelectorAll('.quality-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) selectQuality(e.target.value);
            });
        });

        document.getElementById('download-btn').addEventListener('click', downloadImage);
        document.getElementById('regenerate-btn').addEventListener('click', regenerateDesign);
        document.getElementById('retry-btn').addEventListener('click', () => {
            showCanvas('empty');
            renderUI();
        });

        document.addEventListener('authChange', () => {
            console.log('Auth status changed, updating designer state.');
            checkAuthStatus(); // Re-run the auth check
        });
    }


    // --- UI RENDERER ---
function renderUI() {
    // Cache elements for this function
    const generateBtn = elements.generateBtn;
    const mobileGenerateBtn = elements.mobileGenerateBtn;
    const promptInput = elements.promptInput;
    const mobilePromptInput = elements.mobilePromptInput;
    const sidebar = document.querySelector('.designer-sidebar'); // You may need to add this to your `elements` cache

    // Create a "Start New" button if it doesn't exist
    let startNewBtn = document.getElementById('start-new-btn');
    if (!startNewBtn && generateBtn) {
        startNewBtn = document.createElement('button');
        startNewBtn.id = 'start-new-btn';
        startNewBtn.className = 'secondary-button'; // Add a suitable class for styling
        startNewBtn.textContent = 'Start New Design';
        generateBtn.parentNode.insertBefore(startNewBtn, generateBtn.nextSibling);
        startNewBtn.onclick = handleStartNew; // We will create this function next
    }

    if (state.appMode === 'editing') {
        // --- UI for Editing Mode ---
        if (generateBtn) generateBtn.querySelector('.generate-text').textContent = 'Apply Edit';
        if (mobileGenerateBtn) mobileGenerateBtn.querySelector('.generate-text').textContent = 'Apply Edit';
        if (promptInput) promptInput.placeholder = "Describe the change you want to make... (e.g., 'make the text bigger')";
        if (mobilePromptInput) mobilePromptInput.placeholder = "Describe the change...";

        // Hide irrelevant sidebar sections
        if (sidebar) sidebar.classList.add('editing-mode'); // Use a CSS class to hide elements
        if (startNewBtn) startNewBtn.style.display = 'inline-block';

    } else { // 'generating' mode
        // --- UI for Generating Mode ---
        if (generateBtn) generateBtn.querySelector('.generate-text').textContent = 'Generate';
        if (mobileGenerateBtn) mobileGenerateBtn.querySelector('.generate-text').textContent = 'Generate';
        if (promptInput) promptInput.placeholder = "Describe your design idea...";
        if (mobilePromptInput) mobilePromptInput.placeholder = "Describe your design...";

        // Show sidebar sections
        if (sidebar) sidebar.classList.remove('editing-mode');
        if (startNewBtn) startNewBtn.style.display = 'none';
    }

    // --- General UI Logic (validation, etc.) ---
    const isPromptValid = state.prompt.trim().length > 5; // Simplified validation for example
    const canGenerate = isPromptValid && !state.isGenerating;
    if(generateBtn) generateBtn.disabled = !canGenerate;
    if(mobileGenerateBtn) mobileGenerateBtn.disabled = !canGenerate;
}

// --- NEW ACTION HANDLER ---
function handleStartNew() {
    state.appMode = 'generating';
    state.currentGeneration = null;
    state.prompt = '';
    elements.promptInput.value = '';
    elements.mobilePromptInput.value = '';
    showCanvas('empty'); // Assuming you have this function to show the initial empty state
    renderUI();
}
    // --- UI HANDLERS ---

    function handlePromptInput(e) {
        state.prompt = e.target.value;
        if (elements.mobilePromptInput.value !== state.prompt) {
            elements.mobilePromptInput.value = state.prompt;
        }
        if (elements.mobileCharIndicator) elements.mobileCharIndicator.textContent = `${state.prompt.length}/${PROMPT_MAX_LENGTH}`;

        updateCharCount();
        renderUI();
        saveDraft();
    }

    function handleMobilePromptInput(e) {
        state.prompt = e.target.value;
        if (elements.promptInput.value !== state.prompt) {
            elements.promptInput.value = state.prompt;
        }
        if (elements.charIndicator) elements.charIndicator.textContent = `${state.prompt.length}/${PROMPT_MAX_LENGTH}`;

        updateCharCount();
        renderUI();
        saveDraft();
    }

    function useQuickChip(dataset) {
        state.prompt = dataset.prompt;
        elements.promptInput.value = state.prompt;
        elements.mobilePromptInput.value = state.prompt;

        if (dataset.style) selectStyle(dataset.style);
        if (dataset.template) selectTemplate(dataset.template);

        updateCharCount();
        renderUI();
        saveDraft();
    }

    
    /**
 * Scrolls a container to bring a specific element into the center of the view.
 * @param {HTMLElement} container - The scrollable container element.
 * @param {HTMLElement} element - The child element to scroll to.
 */
function scrollIntoViewIfNeeded(container, element) {
    if (container && element) {
        // The options ensure a smooth scroll and center the item horizontally.
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}

    function selectTemplate(size) {
        state.selectedSize = size;
        const container = document.querySelector('.template-grid');
        let activeCard = null;
         document.querySelectorAll('.template-card').forEach(card => {
        const isActive = card.dataset.size === size;
        card.classList.toggle('active', isActive);
        if (isActive) {
            activeCard = card; // Find the active card
        }
    });
         scrollIntoViewIfNeeded(container, activeCard);
    saveDraft();
    }

    function selectStyle(style) {
         state.selectedStyle = style;
    const container = document.querySelector('.style-pills'); // Get the container
    let activePill = null;

    document.querySelectorAll('.style-pill').forEach(pill => {
        const isActive = pill.dataset.style === style;
        pill.classList.toggle('active', isActive);
        if (isActive) {
            activePill = pill; // Find the active pill
        }
    });

    // Call the new helper function
    scrollIntoViewIfNeeded(container, activePill);
    saveDraft();
    }

    function selectQuality(quality) {
        if (quality === 'pro' && !state.isLoggedIn && state.hasUsedFreePro) {
            if (window.layoutCraftNav) {
                window.layoutCraftNav.openAuthModal('signup');
            }
            // Revert selection
            document.getElementById('quality-fast').checked = true;
            document.getElementById('quality-fast-mobile').checked = true;
            return;
        }
        state.selectedQuality = quality;
        // Sync both desktop and mobile radio buttons
        document.getElementById(`quality-${quality}`).checked = true;
        document.getElementById(`quality-${quality}-mobile`).checked = true;
        saveDraft();
    }

    function updateCharCount() {
        const length = state.prompt.length;
        const countText = `${length}/${PROMPT_MAX_LENGTH}`;
        elements.charIndicator.textContent = countText;
        elements.mobileCharIndicator.textContent = countText;
        const isOverLimit = length > PROMPT_MAX_LENGTH;
        elements.charIndicator.style.color = isOverLimit ? '#dc2626' : '#9ca3af';
        elements.mobileCharIndicator.style.color = isOverLimit ? '#dc2626' : '#9ca3af';
    }

    function updateUI() {
        const isValid = state.prompt.trim().length >= 10 &&
            state.prompt.length <= PROMPT_MAX_LENGTH &&
            !state.isGenerating;
        elements.generateBtn.disabled = !isValid;
        elements.mobileGenerateBtn.disabled = !isValid;
    }

    function showCanvas(canvasName) {
        Object.values(elements.canvasStates).forEach(canvas => {
            canvas.style.display = 'none';
        });
        if (elements.canvasStates[canvasName]) {
            elements.canvasStates[canvasName].style.display = 'flex';
        }
    }

    // --- AUTHENTICATION ---

    function checkAuthStatus() {
        state.isLoggedIn = authService.hasToken();
        state.hasUsedFreePro = localStorage.getItem('layoutcraft_pro_used') === 'true';
        updateProBadge();
    }

    function updateProBadge() {
        const canUsePro = state.isLoggedIn || !state.hasUsedFreePro;
        document.querySelectorAll('.pro-badge').forEach(badge => {
            badge.classList.toggle('available', canUsePro);
        });
    }

    // --- CORE GENERATION LOGIC ---


    // In /app/js/designer.js, replace the existing generateDesign function

    async function generateDesign() {
    // --- 1. VALIDATION (Combined) ---
    if (state.isGenerating) return;

    const promptLength = state.prompt.trim().length;
    if (state.appMode === 'generating' && promptLength < 10) {
        showError("Please provide a more detailed description (at least 10 characters).");
        return;
    }
    if (promptLength === 0 && state.appMode === 'editing') {
        showError("Please provide an instruction for the edit.");
        return;
    }
    if (state.prompt.length > PROMPT_MAX_LENGTH) {
        showError(`Please shorten your prompt (maximum ${PROMPT_MAX_LENGTH} characters).`);
        return;
    }

    // --- 2. PREPARE FOR API CALL (Universal) ---
    state.isGenerating = true;
    setButtonsLoading(true);
    showCanvas('loading');
    startLoadingAnimation();
    renderUI();

    try {
        const isLoggedIn = authService.hasToken();

        if (isLoggedIn) {
            // --- AUTHENTICATED USER LOGIC ---
            await handleAuthenticatedGeneration();
        } else {
            // --- ANONYMOUS USER LOGIC ---
            await handleAnonymousGeneration();
        }

    } catch (error) {
        console.error('Generation failed:', error);
        state.failedAttempts++;
        showError(formatErrorMessage(error));
    } finally {
        // --- 6. CLEANUP (Universal) ---
        state.isGenerating = false;
        stopLoadingAnimation();
        setButtonsLoading(false);
        renderUI();
        checkAuthStatus();
    }
}

async function handleAuthenticatedGeneration() {
    let response;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
    };

    if (state.appMode === 'editing' && state.currentGeneration) {
        // --- EDITING LOGIC ---
        if (state.selectedQuality === 'pro' && !state.isLoggedIn && state.hasUsedFreePro) {
            if (window.layoutCraftNav) window.layoutCraftNav.openAuthModal('signup');
            return;
        }
        const endpoint = `${authService.apiBaseUrl}/users/history/${state.currentGeneration.id}/edit`;
        const body = JSON.stringify({ edit_prompt: state.prompt.trim() });
        response = await fetch(endpoint, { method: 'POST', headers, body });
    } else {
        // --- NEW GENERATION LOGIC ---
        let themeToSend = state.selectedStyle;
        if (themeToSend === 'auto') {
            const styles = ['glassmorphism_premium', 'bold_geometric_solid', 'textured_organic_patterns', 'minimal_luxury_space', 'vibrant_gradient_energy', 'dark_neon_tech', 'editorial_magazine_layout'];
            themeToSend = styles[Math.floor(Math.random() * styles.length)];
        }
    
        const endpoint = `${authService.apiBaseUrl}/api/v1/generate`;
        const body = JSON.stringify({
            prompt: state.prompt.trim(),
            model: state.selectedQuality === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
            theme: themeToSend,
            size_preset: state.selectedSize
        });
        response = await fetch(endpoint, { method: 'POST', headers, body });
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unexpected server error occurred.' }));
        throw new Error(errorData.detail);
    }

    const resultData = await response.json();
    state.currentGeneration = resultData;
    state.appMode = 'editing';
    state.prompt = '';
    elements.promptInput.value = '';
    if (elements.mobilePromptInput) elements.mobilePromptInput.value = '';
    updateCharCount();
    elements.resultImage.src = state.currentGeneration.image_url;
    showResult();
    state.failedAttempts = 0;
}
function showResultFromBlob(imageBlob) {
    if (!imageBlob || imageBlob.size === 0) {
        throw new Error('Received empty image data from server.');
    }
    
    // This logic is from your original function
    if (state.currentImage && state.currentImage.url) {
        URL.revokeObjectURL(state.currentImage.url); // Clean up old blob URL
    }

    state.currentImage = {
        url: URL.createObjectURL(imageBlob),
        filename: generateFilename()
    };
    
    elements.resultImage.src = state.currentImage.url;
    showResult(); // Call your existing showResult to handle the canvas visibility
}

async function handleAnonymousGeneration() {
    if (state.anonymousGenerationsRemaining <= 0) {
        showError("You have used all your free generations. Please sign up to continue creating.");
        if (window.layoutCraftNav) window.layoutCraftNav.openAuthModal('signup');
        return;
    }

    let themeToSend = state.selectedStyle;
    if (themeToSend === 'auto') {
        const styles = ['glassmorphism_premium', 'bold_geometric_solid', 'textured_organic_patterns', 'minimal_luxury_space', 'vibrant_gradient_energy', 'dark_neon_tech', 'editorial_magazine_layout'];
        themeToSend = styles[Math.floor(Math.random() * styles.length)];
    }

    const endpoint = `${authService.apiBaseUrl}/api/generate`;
    const body = JSON.stringify({
        prompt: state.prompt.trim(),
        model: state.selectedQuality === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
        theme: themeToSend,
        size_preset: state.selectedSize
    });

    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unexpected server error occurred.' }));
        throw new Error(errorData.detail);
    }

    // Anonymous endpoint returns a blob
    const imageBlob = await response.blob();
    showResultFromBlob(imageBlob);

    // Update remaining quota from header
    const remaining = response.headers.get('X-Generations-Remaining');
    if (remaining !== null) {
        state.anonymousGenerationsRemaining = parseInt(remaining, 10);
    }
    
    state.failedAttempts = 0;

    // After the first successful anonymous generation, prompt user to sign up to enable editing
    showError("Sign up for free to save and edit this design.");
}

    function showResult() {
        // elements.resultImage.src = state.currentImage.url;
        elements.resultImage.onload = () => {
            showCanvas('result');
        };
        elements.resultImage.onerror = () => {
            showError("Failed to load the generated image.");
        };
    }

    function showError(message) {
        elements.errorMessageText.textContent = message;
        if (state.failedAttempts >= 2) {
            elements.errorMessageText.textContent += " Try simplifying your prompt.";
        }
        showCanvas('error');
    }

    function setButtonsLoading(isLoading) {
        document.querySelectorAll('.generate-button').forEach(btn => {
            btn.classList.toggle('loading', isLoading);
        });
    }

    // --- HELPER & UTILITY FUNCTIONS (from scripts.js) ---

    function formatErrorMessage(error) {
        const message = error.message || error.toString();
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
            return 'Unable to connect to servers. Please check your internet connection.';
        }
        if (message.includes('429') || message.includes('rate limit')) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        if (message.includes('500') || message.includes('502') || message.includes('503')) {
            return 'Our servers are experiencing issues. Please try again in a few minutes.';
        }
        return message;
    }

    function regenerateDesign() {
        const variations = [', with a fresh approach', ', alternative composition', ', different color scheme', ', enhanced visual appeal'];
        const originalPrompt = state.prompt.split(',')[0].trim();
        state.prompt = originalPrompt + variations[Math.floor(Math.random() * variations.length)];
        elements.promptInput.value = state.prompt;
        elements.mobilePromptInput.value = state.prompt;
        generateDesign().finally(() => {
            state.prompt = originalPrompt; // Restore original prompt for user
            elements.promptInput.value = state.prompt;
            elements.mobilePromptInput.value = state.prompt;
        });
    }

    function downloadImage() {

        if (!state.isLoggedIn) {
        // If not logged in, open the signup modal
        if (window.layoutCraftNav) {
            window.layoutCraftNav.openAuthModal('signup');
        }
        return; // Stop the function here
    }
        if (!state.currentImage) return;
        const a = document.createElement('a');
        a.href = state.currentImage.url;
        a.download = state.currentImage.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function generateFilename() {
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        const promptSlug = state.prompt.slice(0, 30).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
        return `layoutcraft_${promptSlug}_${timestamp}.png`;
    }

    function loadDraft() {
        try {
            const draft = localStorage.getItem('layoutcraft_designer_draft');
            if (draft) {
                const data = JSON.parse(draft);
                state.prompt = data.prompt || '';
                state.selectedSize = data.size || 'blog_header';
                state.selectedStyle = data.style || 'auto';
                state.selectedQuality = data.quality || 'pro';

                elements.promptInput.value = state.prompt;
                elements.mobilePromptInput.value = state.prompt;
                selectTemplate(state.selectedSize);
                selectStyle(state.selectedStyle);
                selectQuality(state.selectedQuality);
                updateCharCount();
            }
        } catch (e) {
            console.warn("Could not load draft.", e);
        }
    }

    function saveDraft() {
        try {
            const draft = {
                prompt: state.prompt,
                size: state.selectedSize,
                style: state.selectedStyle,
                quality: state.selectedQuality,
            };
            localStorage.setItem('layoutcraft_designer_draft', JSON.stringify(draft));
        } catch (e) {
            console.warn("Could not save draft.", e);
        }
    }

    // In /app/js/designer.js, replace the checkSessionForPrompt function

function checkSessionForPrompt() {
    const dataStr = sessionStorage.getItem('layoutcraft_initial_data');

    if (dataStr) {
        try {
            const data = JSON.parse(dataStr);

            // Set the prompt
            if (data.prompt) {
                state.prompt = data.prompt;
                elements.promptInput.value = state.prompt;
                elements.mobilePromptInput.value = state.prompt;
                updateCharCount();
            }

            // Auto-select the style and template
            if (data.style) {
                selectStyle(data.style);
            }
            if (data.template) {
                selectTemplate(data.template);
            }

        } catch (e) {
            console.error("Failed to parse initial data from session storage:", e);
        } finally {
            // ALWAYS remove the item from storage to prevent re-use
            sessionStorage.removeItem('layoutcraft_initial_data');
        }
    }
}

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                generateDesign();
            }
        });
    }

    // --- LOADING ANIMATION (from scripts.js) ---
    let progressInterval;
    let messageInterval;
    function startLoadingAnimation() {
        const messages = {
            fast: ['Firing up the AI engine...', 'Analyzing your prompt...', 'Creating visual elements...', 'Finalizing your design...'],
            pro: ['Initializing Pro AI Designer...', 'Deep analysis of requirements...', 'Crafting premium elements...', 'Optimizing visual hierarchy...', 'Applying professional polish...']
        };
        const tips = ['Pro tip: Be specific about colors and text', 'Pro tip: Mention the mood you want to create', 'Pro tip: Include any text that should appear'];
        
        let progress = 0;
        elements.progressBar.style.width = '0%';
        
        const currentMessages = messages[state.selectedQuality];
        let messageIndex = 0;
        elements.loadingMessageText.textContent = currentMessages[0];
        elements.loadingTipText.textContent = tips[Math.floor(Math.random() * tips.length)];
        
        const duration = state.selectedQuality === 'pro' ? 60000 : 30000;
        progressInterval = setInterval(() => {
            progress = Math.min(progress + (100 / (duration / 100)), 95);
            elements.progressBar.style.width = `${progress}%`;
        }, 100);
        
        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % currentMessages.length;
            elements.loadingMessageText.textContent = currentMessages[messageIndex];
        }, duration / currentMessages.length);
    }

    function stopLoadingAnimation() {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        if (elements.progressBar) {
            elements.progressBar.style.width = '100%';
        }
    }

    // Add this function to designer.js
async function checkUrlForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        // Clear the ?edit=... from the URL to avoid confusion on reloads
        history.replaceState(null, '', window.location.pathname);

        // Show loading state while we fetch the design
        showCanvas('loading');

        try {
            const response = await fetch(`${authService.apiBaseUrl}/users/history/${editId}`, {
                headers: { 'Authorization': `Bearer ${authService.getToken()}` }
            });
            if (!response.ok) {
                throw new Error('Could not load the selected design.');
            }
            const designToEdit = await response.json();

            // Set the state to edit mode with the fetched design
            state.appMode = 'editing';
            state.currentGeneration = designToEdit;

            // Update the UI with the design's data
            elements.resultImage.src = designToEdit.image_url;
            showResult(); // Display the image to be edited
            renderUI(); // Set the UI to editing mode

        } catch (error) {
            showError(error.message);
            // Fallback to the default generating mode
            handleStartNew();
        }
    }
}

    // --- RUN INITIALIZATION ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
