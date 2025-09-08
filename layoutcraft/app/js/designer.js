import { authService } from "../../shared/js/authService.js";

(function () {
    'use strict';

    // --- STATE MANAGEMENT ---
    const state = {
        appMode: 'generating', // 'generating' or 'editing'
        generatedDesigns: [], // This will store the transformed image objects
        generation_id: null, // <-- ADD THIS: To store the ID for the whole group
        selectedForEditing: [], // <-- This will now store size_preset strings, e.g., ['blog_header']
        prompt: '',
        selectedDimensions: ['blog_header', 'social_square'], // Default to a single item in an array
        selectedStyle: 'auto',
        isGenerating: false,
        isLoggedIn: false,
    };

    // --- DATA ---
    const DIMENSIONS_DATA = [
        { value: "blog_header", label: "Blog Header (1200x630)" },
        { value: "social_square", label: "Social Post (1080x1080)" },
        { value: "story", label: "Story (1080x1920)" },
        { value: "twitter_post", label: "Twitter Post (1024x512)" },
        { value: "youtube_thumbnail", label: "YouTube Thumbnail (1280x720)" },
    ];
    const STYLE_DATA = [
        { value: "auto", label: "✨ Auto" },
        { value: "bold_geometric_solid", label: "Bold Geometric" },
        { value: "minimal_luxury_space", label: "Minimal" },
        { value: "vibrant_gradient_energy", label: "Vibrant" },
        { value: "dark_neon_tech", label: "Neon Tech" },
    ];
    const PROMPT_MAX_LENGTH = 500;


    // --- DOM ELEMENT CACHE ---
    const elements = {
        promptInput: document.getElementById('prompt-input'),
        charIndicator: document.querySelector('.char-indicator'),
        generateBtn: document.getElementById('generate-btn'),
        canvasStates: {
            empty: document.getElementById('empty-canvas'),
            loading: document.getElementById('loading-canvas'),
            error: document.getElementById('error-canvas'),
        },
        resultsHeader: document.getElementById('results-header'),
        resultsWrapper: document.getElementById('results-container-wrapper'),
        resultsContainer: document.getElementById('results-container'),
        dimensionsDropdownContainer: document.getElementById('dimensions-dropdown-container'),
        styleDropdownContainer: document.getElementById('style-dropdown-container'),
        errorMessageText: document.getElementById('error-message'),
        loadingMessageText: document.getElementById('loading-message'),
        loadingTipText: document.getElementById('loading-tip'),
        progressBar: document.getElementById('progress-bar'),
        retryBtn: document.getElementById('retry-btn'),
    };

    // --- INITIALIZATION ---
    function init() {
        checkAuthStatus();
        setupEventListeners();
        loadDesignForEditing(); // Check for ?edit=... parameter
        renderUI();
        console.log("LayoutCraft Designer Initialized");
    }

    function setupEventListeners() {
        elements.promptInput.addEventListener('input', handlePromptInput);
        elements.generateBtn.addEventListener('click', performAction);
        elements.retryBtn.addEventListener('click', handleStartNew);
        document.addEventListener('authChange', onAuthChange);

        // Global listener to close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    function onAuthChange() {
        checkAuthStatus();
        renderUI(); // Re-render everything to apply auth-based changes
    }

    function checkAuthStatus() {
        state.isLoggedIn = authService.hasToken();
    }

    // --- UI RENDERING & MANAGEMENT ---
    function renderUI() {
        renderDropdowns();
        updateActionButtonState();

        const inEditMode = state.appMode === 'editing';

        if (inEditMode) {
            elements.promptInput.placeholder = "Describe the change you want to make...";
            renderResultsHeader();
            renderResults();
            showCanvas('results');
        } else {
            elements.promptInput.placeholder = "Describe your design idea...";
            showCanvas('empty');
        }
    }

    function renderDropdowns() {
        createDropdown('dimensions', DIMENSIONS_DATA, true);
        createDropdown('style', STYLE_DATA, false);
    }

    function createDropdown(type, options, isMultiSelect) {
        const container = elements[`${type}DropdownContainer`];
        container.innerHTML = '';
        const dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';
        
        const button = document.createElement('button');
        button.className = 'dropdown-toggle';
        
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';

        const updateButtonLabel = () => {
            if (isMultiSelect) {
                const count = state.selectedDimensions.length;
                button.textContent = `Dimensions (${count})`;
            } else {
                const selected = options.find(o => o.value === state.selectedStyle);
                button.textContent = `Style: ${selected ? selected.label : 'Auto'}`;
            }
        };

        options.forEach((option, index) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            
            const isLocked = isMultiSelect && !state.isLoggedIn && index > 1;
            
            item.innerHTML = `<label class="${isLocked ? 'locked' : ''}">
                <input type="${isMultiSelect ? 'checkbox' : 'radio'}" 
                       name="style-option"
                       value="${option.value}" 
                       ${isMultiSelect ? (state.selectedDimensions.includes(option.value) ? 'checked' : '') : (state.selectedStyle === option.value ? 'checked' : '')}
                       ${isLocked ? 'disabled' : ''}>
                ${option.label} ${isLocked ? '🔒' : ''}
            </label>`;
            
            if (isLocked) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.layoutCraftNav?.openAuthModal('signup');
                });
            } else {
                item.querySelector('input').addEventListener('change', (e) => {
                    handleSelectionChange(type, option.value, e.target.checked);
                    updateButtonLabel();
                    if (!isMultiSelect) menu.classList.remove('show');
                });
            }
            menu.appendChild(item);
        });

        updateButtonLabel();
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
                if (otherMenu !== menu) otherMenu.classList.remove('show');
            });
            menu.classList.toggle('show');
        });
        
        dropdown.appendChild(button);
        dropdown.appendChild(menu);
        container.appendChild(dropdown);
    }

    function renderResultsHeader() {
        elements.resultsHeader.innerHTML = '';
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.className = 'header-action-btn secondary';
        downloadAllBtn.textContent = 'Download All';
        downloadAllBtn.onclick = downloadAllImages; 

        const startNewBtn = document.createElement('button');
        startNewBtn.className = 'header-action-btn primary';
        startNewBtn.textContent = 'Start New';
        startNewBtn.onclick = handleStartNew;

        elements.resultsHeader.appendChild(downloadAllBtn);
        elements.resultsHeader.appendChild(startNewBtn);
    }
    function renderResults() {
        elements.resultsContainer.innerHTML = '';
        state.generatedDesigns.forEach(design => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.dataset.sizePreset = design.size_preset;

            if (state.selectedForEditing.includes(design.size_preset)) {
                card.classList.add('selected');
            }

            card.innerHTML = `
    <div class="selection-indicator">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
    </div>
    <img src="${design.image_url}" class="result-card-image" alt="Generated design for ${design.size_preset}">
    <div class="result-actions-strip">
        <span class="dimension-label">${design.size_preset.replace(/_/g, ' ')}</span>
        <div class="result-action-buttons">
            <button class="result-action-btn preview-btn" data-image-url="${design.image_url}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            </button>
            <button class="result-action-btn download-btn" data-image-url="${design.image_url}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
        </div>
    </div>
`;

            card.addEventListener('click', () => handleResultSelection(design.size_preset));
            card.querySelector('.preview-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openImagePreview(design.image_url);
            });

            card.querySelector('.download-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadImage(design.image_url, `${design.size_preset}.png`);
            });
            elements.resultsContainer.appendChild(card);
        });
    }

    // --- UI HANDLERS & STATE UPDATES ---

    function handleSelectionChange(type, value, isSelected) {
        if (type === 'dimensions') {
            if (isSelected) {
                if (!state.selectedDimensions.includes(value)) state.selectedDimensions.push(value);
            } else {
                state.selectedDimensions = state.selectedDimensions.filter(d => d !== value);
            }
        } else {
            state.selectedStyle = value;
            renderDropdowns();
        }
        updateActionButtonState();
    }

    function handleResultSelection(sizePreset) {
        if (state.appMode !== 'editing') return;
        const index = state.selectedForEditing.indexOf(sizePreset);
        
        if (index > -1) {
            state.selectedForEditing = state.selectedForEditing.filter(preset => preset !== sizePreset);
        } else {
            state.selectedForEditing.push(sizePreset);
        }

        
        const card = elements.resultsContainer.querySelector(`.result-card[data-size-preset="${sizePreset}"]`);
        if (card) card.classList.toggle('selected');
        
        updateActionButtonState();
    }

    function handlePromptInput() {
        state.prompt = elements.promptInput.value;
        elements.charIndicator.textContent = `${state.prompt.length}/${PROMPT_MAX_LENGTH}`;
        updateActionButtonState();
    }
    
    function handleStartNew() {
        state.appMode = 'generating';
        state.generatedDesigns = [];
        state.selectedForEditing = [];
        state.prompt = '';
        elements.promptInput.value = '';
        elements.charIndicator.textContent = `0/${PROMPT_MAX_LENGTH}`;
        renderUI();
    }

    // function updateActionButtonState() {
    //     const btnText = elements.generateBtn.querySelector('.generate-text');
    //     const hasText = state.prompt.trim().length > 0;

    //     setButtonsLoading(state.isGenerating);

    //     if (state.appMode === 'editing') {
    //         const selectionCount = state.selectedForEditing.length;
    //         btnText.textContent = selectionCount > 0 ? `Refine ${selectionCount} Design(s)` : 'Refine';
    //         elements.generateBtn.disabled = !(hasText && selectionCount > 0) || state.isGenerating;
    //     } else {
    //         btnText.textContent = 'Generate';
    //         elements.generateBtn.disabled = !(hasText && state.selectedDimensions.length > 0) || state.isGenerating;
    //     }
    // }

    function updateActionButtonState() {
        const btnText = elements.generateBtn.querySelector('.generate-text');
        const hasText = state.prompt.trim().length > 0;

        setButtonsLoading(state.isGenerating);

        if (state.appMode === 'editing') {
            const selectionCount = state.selectedForEditing.length;
            if (state.isGenerating) {
                btnText.textContent = `Refining ${selectionCount} Design(s)...`;
            } else {
                btnText.textContent = selectionCount > 0 ? `Refine ${selectionCount} Design(s)` : 'Select designs to refine';
            }
            elements.generateBtn.disabled = !(hasText && selectionCount > 0) || state.isGenerating;
        } else {
            if (state.isGenerating) {
                btnText.textContent = 'Generating...';
            } else {
                btnText.textContent = 'Generate';
            }
            elements.generateBtn.disabled = !(hasText && state.selectedDimensions.length > 0) || state.isGenerating;
        }
    }

    function showCanvas(stateName) {
        Object.values(elements.canvasStates).forEach(canvas => canvas.style.display = 'none');
        elements.resultsWrapper.style.display = 'none';
        elements.resultsHeader.style.display = 'none';

        if (stateName === 'results') {
            elements.resultsWrapper.style.display = 'flex';
            elements.resultsHeader.style.display = 'flex';
        } else if (elements.canvasStates[stateName]) {
            elements.canvasStates[stateName].style.display = 'flex';
        }
    }

    // --- CORE LOGIC & API ---
    async function performAction() {
        if (elements.generateBtn.disabled) return;
        
        state.isGenerating = true;
        updateActionButtonState();
        showCanvas('loading');
        startLoadingAnimation();

        try {
            if (state.appMode === 'generating') {
                const endpoint = state.isLoggedIn ? `${authService.apiBaseUrl}/api/v1/generate` : `${authService.apiBaseUrl}/api/generate`;
                const headers = { 'Content-Type': 'application/json' };
                if (state.isLoggedIn) headers['Authorization'] = `Bearer ${authService.getToken()}`;
                
                const presetsToSend = state.isLoggedIn ? state.selectedDimensions : state.selectedDimensions.slice(0, 2);
                const body = {
                    prompt: state.prompt,
                    theme: state.selectedStyle,
                    size_presets: presetsToSend
                };

                const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

                if (!response.ok) {
                    if (response.status === 429 && !state.isLoggedIn) {
                        window.layoutCraftNav?.openAuthModal('signup');
                        throw new Error("You've reached your free generation limit. Please sign up to continue.");
                    }
                    throw new Error((await response.json()).detail || 'Failed to generate designs.');
                }

                const generationGroup = await response.json();
                state.generation_id = generationGroup.id;
                state.generatedDesigns = generationGroup.images_json;
                // state.generatedDesigns = await response.json();
                
                state.appMode = 'editing';
                state.selectedForEditing = state.generatedDesigns.map(d => d.size_preset); // Select all by default

            } else { // Editing
                if (!state.isLoggedIn) {
                    window.layoutCraftNav?.openAuthModal('signup');
                    throw new Error("Please sign up to edit designs.");
                }
                addSpinnersToSelectedDesigns();
                const endpoint = `${authService.apiBaseUrl}/api/refine`;
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                };
                const body = {
                    edit_prompt: state.prompt,
                    generation_id: state.generation_id, // <-- Use the stored generation ID
                    size_presets: state.selectedForEditing    // <-- Send the selected preset strings
                };
                console.log('Refine request body:', body);
                const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
                if (!response.ok) throw new Error((await response.json()).detail || 'Failed to refine designs.');

                const updatedGenerationGroup = await response.json();
                updatedGenerationGroup.images_json.forEach(updatedImage => {
                    const index = state.generatedDesigns.findIndex(d => d.size_preset === updatedImage.size_preset);
                    if (index !== -1) {
                        state.generatedDesigns[index].image_url = updatedImage.image_url;
                        // Optionally update other properties if they can change
                    }
                });
                state.generation_id = updatedGenerationGroup.id;
                state.generatedDesigns = updatedGenerationGroup.images_json;
                removeSpinnersFromSelectedDesigns();
                // selectedForEditing remains the same to allow further refinements
            }
            state.prompt = '';
            elements.promptInput.value = '';
            elements.charIndicator.textContent = `0/${PROMPT_MAX_LENGTH}`;
        } catch (error) {
            console.error('Generation/Refinement error:', error);

            // Remove spinners if in editing mode
            if (state.appMode === 'editing') {
                removeSpinnersFromSelectedDesigns();
            }

            showError(error.message);
        } finally {
            state.isGenerating = false;
            stopLoadingAnimation();
            renderUI();
        }
    }


    async function loadDesignForEditing() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit'); // This is the generation_id
        if (!editId) return;

        // Clear the URL to prevent re-triggering on refresh
        history.replaceState(null, '', window.location.pathname);
        if (!authService.hasToken()) {
            window.layoutCraftNav?.openAuthModal('login');
            showError("Please log in to edit your designs.");
            return;
        }

        showCanvas('loading');
        startLoadingAnimation();

        try {
            // CORRECTED: Use the endpoint and parameter as you specified
            const endpoint = `${authService.apiBaseUrl}/users/history/design?generation_id=${editId}`;
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${authService.getToken()}` }
            });
            if (!response.ok) throw new Error('Could not load the selected design group.');

            // The response is the same as the generate endpoint
            const generationGroup = await response.json();

            state.appMode = 'editing';
            state.generation_id = generationGroup.id;

            // CORRECTED: Directly use the images_json array without creating redundant data
            state.generatedDesigns = generationGroup.images_json;

            // Pre-select all designs in the loaded group for editing by their size_preset
            state.selectedForEditing = state.generatedDesigns.map(d => d.size_preset);

        } catch (error) {
            showError(error.message);
            handleStartNew(); // Fallback to a clean state if loading fails
        } finally {
            stopLoadingAnimation();
            renderUI();
        }
    }


    function showError(message) {
        elements.errorMessageText.textContent = message;
        showCanvas('error');
    }

    // --- ANIMATION & UTILITY HELPERS ---
    
    function addSpinnersToSelectedDesigns() {
    state.selectedForEditing.forEach(preset => {
        const card = elements.resultsContainer.querySelector(`.result-card[data-size-preset="${preset}"]`);
        if (card) {
            card.classList.add('refining');
            
            // Create overlay with spinner
            const overlay = document.createElement('div');
            overlay.className = 'refining-overlay';
            overlay.innerHTML = `
                <div class="refining-spinner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 2 A10 10 0 0 1 22 12"/>
                    </svg>
                    <span>Refining...</span>
                </div>
            `;
            card.appendChild(overlay);
        }
    });
}

function removeSpinnersFromSelectedDesigns() {
    state.selectedForEditing.forEach(preset => {
        const card = elements.resultsContainer.querySelector(`.result-card[data-size-preset="${preset}"]`);
        if (card) {
            card.classList.remove('refining');
            const overlay = card.querySelector('.refining-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    });
}
    function setButtonsLoading(isLoading) {
        elements.generateBtn.classList.toggle('loading', isLoading);
    }

    let progressInterval, messageInterval;
    function startLoadingAnimation() {
        const messages = ['Firing up the AI engine...', 'Analyzing your prompt...', 'Crafting visual elements...', 'Applying design principles...'];
        const tips = ['Need changes? Use the prompt bar again after generation.', 'Sign up to generate multiple sizes at once!', 'Editing a past design? Just click "Edit" from your library.'];

        let progress = 0;
        if (elements.progressBar) elements.progressBar.style.width = '0%';
        
        let messageIndex = 0;
        elements.loadingMessageText.textContent = messages[0];
        elements.loadingTipText.textContent = `Tip: ${tips[Math.floor(Math.random() * tips.length)]}`;
        
        const duration = 30000; // Average duration
        progressInterval = setInterval(() => {
            progress = Math.min(progress + (100 / (duration / 100)), 95);
            if (elements.progressBar) elements.progressBar.style.width = `${progress}%`;
        }, 100);

        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            elements.loadingMessageText.textContent = messages[messageIndex];
        }, duration / messages.length);
    }

    function stopLoadingAnimation() {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        if (elements.progressBar) {
            elements.progressBar.style.width = '100%';
        }
    }

    function openImagePreview(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.9); display: flex; align-items: center; 
        justify-content: center; z-index: 1000; cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px;';
    
    modal.appendChild(img);
    modal.addEventListener('click', () => document.body.removeChild(modal));
    document.body.appendChild(modal);
}
    async function downloadImage(imageUrl, preset) {
    if (!state.isLoggedIn) {
        if (window.layoutCraftNav) {
            window.layoutCraftNav.openAuthModal('signup');
        }
        return;
    }

    const filename = `layoutcraft_${preset}_${Date.now()}.png`;
    try {
        await downloadFromUrl(imageUrl, filename);
    } catch (error) {
        console.error('Download failed:', error);
        showError("Download failed. Please try again.");
    } finally {
        button.textContent = 'Download';
        button.disabled = false;
    }
}

async function downloadAllImages() {
    if (!state.generatedDesigns || state.generatedDesigns.length === 0) {
        showError("No images to download.");
        return;
    }

    const button = document.querySelector('.header-action-btn.secondary');
    if (button) {
        button.textContent = 'Downloading...';
        button.disabled = true;
    }

    try {
        for (let i = 0; i < state.generatedDesigns.length; i++) {
            const design = state.generatedDesigns[i];
            const filename = `layoutcraft_${design.size_preset}_${Date.now()}_${i + 1}.png`;
            await downloadFromUrl(design.image_url, filename);
            
            // Small delay between downloads to be nice to the browser
            if (i < state.generatedDesigns.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    } catch (error) {
        showError("Download failed. Please try again.");
    } finally {
        if (button) {
            button.textContent = 'Download All';
            button.disabled = false;
        }
    }
}

// Unified download helper function
async function downloadFromUrl(imageUrl, filename) {

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error('Could not fetch the image for download.');
        }
        const imageBlob = await response.blob();
        const blobUrl = URL.createObjectURL(imageBlob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(blobUrl);
    
    }

    // --- RUN INITIALIZATION ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

