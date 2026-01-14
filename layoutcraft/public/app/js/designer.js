import { authService } from "../../shared/js/authService.js";
import { subscriptionService } from "../../shared/js/subscriptionService.js";

(function () {
    'use strict';

    if (!authService.hasToken() || authService.isTokenExpired()) {
        // Redirect to the homepage and add a parameter to trigger the auth modal.
        window.location.href = '/?auth=required';
        return;
    }
    // --- STATE MANAGEMENT ---
    const state = {
        appMode: 'generating', // 'generating' or 'editing'
        generatedDesigns: [], // This will store the transformed image objects
        generation_id: null, // <-- ADD THIS: To store the ID for the whole group
        selectedForEditing: [], // <-- This will now store size_preset strings, e.g., ['blog_header']
        prompt: '',
        selectedDimensions: [], // Empty means "All Formats" is selected
        allFormatsSelected: true, // Default to All Formats
        selectedStyle: 'auto',
        isGenerating: false,
    };

    // --- DATA ---
    const DIMENSIONS_DATA = [
        { value: "all_formats", label: "All Formats", isAllFormats: true },
        { value: "blog_header", label: "Blog Header (1200x630)" },
        { value: "social_square", label: "Social Post (1080x1080)" },
        { value: "story", label: "Story (1080x1920)" },
        { value: "twitter_post", label: "Twitter Post (1024x512)" },
        { value: "youtube_thumbnail", label: "YouTube Thumbnail (1280x720)" },
    ];
    const ALL_DIMENSION_VALUES = DIMENSIONS_DATA.filter(d => !d.isAllFormats).map(d => d.value);
    const STYLE_DATA = [
        { value: "auto", label: "Auto" },
        { value: "minimal_luxury_space", label: "Minimal & Clean" },
        { value: "bold_geometric_solid", label: "Bold Geometric" },
        { value: "dark_neon_tech", label: "Neon / Tech" },
        { value: "vibrant_gradient_energy", label: "Vibrant Energy" },
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
        appContainer: document.querySelector('.designer-app'),
        workspaceLayout: document.querySelector('.workspace-layout'),
        useBrandKitToggle: document.getElementById('use-brand-kit'),
    };

    // ... after the elements object

    function showUpgradeModal(message) {
        // First, remove any existing modal to prevent duplicates
        const existingModal = document.getElementById('upgrade-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
        <div class="auth-modal-overlay active" id="upgrade-modal" style="z-index: 10001;">
            <div class="auth-modal-content">
                <button class="auth-modal-close" type="button">×</button>
                <h2 class="auth-modal-title">Upgrade to Pro</h2>
                <p class="auth-modal-subtitle">${message}</p>
                <a href="/pricing/" class="btn btn-primary" style="width: 100%; text-align: center; margin-top: 1rem;">View Pro Features</a>
            </div>
        </div>
    `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('upgrade-modal');
        modal.querySelector('.auth-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // --- INITIALIZATION ---
    async function init() {
        // Show the workspace layout
        if (elements.workspaceLayout) {
            elements.workspaceLayout.style.visibility = 'visible';
            elements.workspaceLayout.style.opacity = '1';
        }
        checkAuthStatus();
        setupEventListeners();
        await subscriptionService.fetchSubscription();

        // Set default dimension for free users (All Formats is Pro-only)
        if (!subscriptionService.isOnTrialOrPro()) {
            state.allFormatsSelected = false;
            state.selectedDimensions = ['blog_header']; // Default to first option
        }

        loadInitialData(); // Load any initial data from sessionStorage
        loadDesignForEditing(); // Check for ?edit=... parameter
        renderUI();
        console.log("LayoutCraft Designer Initialized");
    }

    function setupEventListeners() {
        elements.promptInput.addEventListener('input', handlePromptInput);
        elements.generateBtn.addEventListener('click', performAction);
        elements.retryBtn.addEventListener('click', handleStartNew);
        document.addEventListener('authChange', onAuthChange);

        // Listen for design load events from workspace history view
        document.addEventListener('loadDesign', (e) => {
            hydrateStateFromDesign(e.detail);
            renderUI();
        });

        // Global listener to close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    // Hydrate editor state from a loaded design (from history)
    function hydrateStateFromDesign(designData) {
        state.appMode = 'editing';
        state.generation_id = designData.generation_id;
        state.generatedDesigns = designData.images_json || [];
        state.selectedForEditing = state.generatedDesigns.map(d => d.size_preset);

        // Update dimensions state
        const loadedPresets = state.generatedDesigns.map(d => d.size_preset);
        if (loadedPresets.length === ALL_DIMENSION_VALUES.length &&
            ALL_DIMENSION_VALUES.every(v => loadedPresets.includes(v))) {
            state.allFormatsSelected = true;
            state.selectedDimensions = [];
        } else {
            state.allFormatsSelected = false;
            state.selectedDimensions = loadedPresets;
        }

        // Update style if provided
        if (designData.theme) {
            state.selectedStyle = designData.theme;
        }

        // Clear any existing prompt
        state.prompt = '';
        elements.promptInput.value = '';
        elements.charIndicator.textContent = `0/${PROMPT_MAX_LENGTH}`;
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

    // ADD THIS NEW FUNCTION
    function loadInitialData() {
        const initialDataString = sessionStorage.getItem('layoutcraft_initial_data');
        if (initialDataString) {
            try {
                const data = JSON.parse(initialDataString);
                // Update the state with the data from the homepage
                if (data.prompt) {
                    state.prompt = data.prompt;
                    elements.promptInput.value = data.prompt;
                }
                if (data.template) {
                    if (data.template === 'multi' || data.template === 'all_formats') {
                        state.allFormatsSelected = true;
                        state.selectedDimensions = [];
                    } else if (!subscriptionService.isOnTrialOrPro()) {
                        state.allFormatsSelected = false;
                        state.selectedDimensions = [data.template];
                    } else {
                        state.allFormatsSelected = false;
                        state.selectedDimensions = [data.template];
                    }
                }
                if (data.style) {
                    state.selectedStyle = data.style;
                }
                // Clean up the sessionStorage so it's not used again on refresh
                sessionStorage.removeItem('layoutcraft_initial_data');

                handlePromptInput(); // Updates character count
                renderDropdowns(); // Re-renders dropdowns with new selections
            } catch (e) {
                console.error("Failed to parse initial data:", e);
                sessionStorage.removeItem('layoutcraft_initial_data');
            }
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

        // In edit mode, dropdowns can be viewed but not changed
        const isEditMode = state.appMode === 'editing';

        const button = document.createElement('button');
        button.className = 'dropdown-toggle';
        if (isEditMode) {
            button.classList.add('locked');
        }

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';

        const updateButtonLabel = () => {
            let labelText = '';
            if (isMultiSelect) {
                if (state.allFormatsSelected) {
                    labelText = 'All Formats';
                } else {
                    const count = state.selectedDimensions.length;
                    labelText = count === 1
                        ? DIMENSIONS_DATA.find(d => d.value === state.selectedDimensions[0])?.label || `Dimensions (${count})`
                        : `Dimensions (${count})`;
                }
            } else {
                const selected = options.find(o => o.value === state.selectedStyle);
                labelText = `Style: ${selected ? selected.label : 'Auto'}`;
            }
            // Set the button text (no lock icon needed)
            button.textContent = labelText;
        };

        const updateAllCheckboxStates = () => {
            if (!isMultiSelect) return;
            const allFormatsCheckbox = menu.querySelector('input[value="all_formats"]');
            const otherCheckboxes = menu.querySelectorAll('input:not([value="all_formats"])');

            if (allFormatsCheckbox) {
                allFormatsCheckbox.checked = state.allFormatsSelected;
            }
            otherCheckboxes.forEach(cb => {
                if (state.allFormatsSelected) {
                    cb.checked = true;
                } else {
                    cb.checked = state.selectedDimensions.includes(cb.value);
                }
            });
        };

        options.forEach((option, index) => {
            const item = document.createElement('div');
            const isAllFormatsOption = option.isAllFormats;
            const isPro = subscriptionService.isOnTrialOrPro();

            // Lock "All Formats" for free users, and lock additional dimensions beyond the first for free users
            const isAllFormatsLocked = isAllFormatsOption && !isPro;
            const isLocked = isMultiSelect && !isAllFormatsOption && !isPro && index > 1;

            item.className = 'dropdown-item';

            let isChecked = false;
            if (isMultiSelect) {
                if (isAllFormatsOption) {
                    // Free users can never have All Formats selected
                    isChecked = isPro && state.allFormatsSelected;
                } else {
                    isChecked = state.allFormatsSelected || state.selectedDimensions.includes(option.value);
                }
            } else {
                isChecked = state.selectedStyle === option.value;
            }

            const isDisabled = isLocked || isAllFormatsLocked || isEditMode;
            const showLockIcon = (isLocked || isAllFormatsLocked) && !isEditMode;

            item.innerHTML = `<label class="${isDisabled ? 'locked' : ''}" style="${isDisabled ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                <input type="${isMultiSelect ? 'checkbox' : 'radio'}"
                name="${type}-option"
                value="${option.value}"
                ${isChecked ? 'checked' : ''}
                ${isDisabled ? 'disabled' : ''}>
                ${option.label} ${showLockIcon ? '<span class="pro-badge-small">PRO</span>' : ''}
            </label>`;

            if ((isLocked || isAllFormatsLocked) && !isEditMode) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const message = isAllFormatsLocked
                        ? 'Generating all formats at once is a Pro feature. Upgrade to create designs in multiple sizes simultaneously!'
                        : 'Selecting multiple dimensions is a Pro feature. Upgrade to generate designs in multiple sizes at once!';
                    showUpgradeModal(message);
                });
            } else if (!isEditMode) {
                item.querySelector('input').addEventListener('change', (e) => {
                    if (isAllFormatsOption) {
                        // Handle "All Formats" toggle
                        if (e.target.checked) {
                            state.allFormatsSelected = true;
                            state.selectedDimensions = [];
                        } else {
                            // When unchecking All Formats, default to first dimension
                            state.allFormatsSelected = false;
                            state.selectedDimensions = ['blog_header'];
                        }
                        updateAllCheckboxStates();
                    } else {
                        handleSelectionChange(type, option.value, e.target.checked);
                        // Update All Formats checkbox state
                        const allFormatsCheckbox = menu.querySelector('input[value="all_formats"]');
                        if (allFormatsCheckbox) {
                            allFormatsCheckbox.checked = state.allFormatsSelected;
                        }
                    }
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
            // When user selects/deselects individual dimensions, turn off "All Formats"
            if (state.allFormatsSelected) {
                // Transition from "All Formats" to individual selection
                state.allFormatsSelected = false;
                // If unchecking something while All Formats was on, keep all except unchecked
                if (!isSelected) {
                    state.selectedDimensions = ALL_DIMENSION_VALUES.filter(d => d !== value);
                } else {
                    // This shouldn't happen (selecting when all selected), but handle it
                    state.selectedDimensions = [value];
                }
            } else {
                // Normal individual selection logic
                if (isSelected) {
                    if (!subscriptionService.isOnTrialOrPro() && state.selectedDimensions.length > 0) {
                        event.target.checked = false;
                        showUpgradeModal('Selecting multiple dimensions is a Pro feature. Upgrade to generate designs in multiple sizes at once!');
                        return;
                    }
                    if (!state.selectedDimensions.includes(value)) {
                        state.selectedDimensions.push(value);
                    }
                    // Check if all dimensions are now selected
                    if (state.selectedDimensions.length === ALL_DIMENSION_VALUES.length) {
                        state.allFormatsSelected = true;
                        state.selectedDimensions = [];
                    }
                } else {
                    state.selectedDimensions = state.selectedDimensions.filter(d => d !== value);
                    // Don't allow deselecting the last dimension
                    if (state.selectedDimensions.length === 0) {
                        state.selectedDimensions = [value];
                        event.target.checked = true;
                    }
                }
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
            const lockIcon = ' 🔒';
            if (!subscriptionService.isOnTrialOrPro() && !btnText.textContent.includes(lockIcon)) {
                btnText.textContent += lockIcon;
            } else if (subscriptionService.isOnTrialOrPro()) {
                btnText.textContent = btnText.textContent.replace(lockIcon, '');
            }
        } else {
            if (state.isGenerating) {
                btnText.textContent = 'Generating...';
            } else {
                btnText.textContent = 'Generate';
            }
            const hasDimensions = state.allFormatsSelected || state.selectedDimensions.length > 0;
            elements.generateBtn.disabled = !(hasText && hasDimensions) || state.isGenerating;
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
        if (state.appMode === 'editing' && !subscriptionService.isOnTrialOrPro()) {
            showUpgradeModal('The ability to refine and edit designs with prompts is a Pro feature. Upgrade to unlock this powerful workflow!');
            return;
        }

        if (elements.generateBtn.disabled) return;

        state.isGenerating = true;
        updateActionButtonState();
        showCanvas('loading');
        startLoadingAnimation();

        try {
            if (state.appMode === 'generating') {
                const dimensionsToSend = state.allFormatsSelected ? ALL_DIMENSION_VALUES : state.selectedDimensions;
                const useBrandKit = elements.useBrandKitToggle?.checked || false;
                const body = {
                    prompt: state.prompt,
                    theme: state.selectedStyle,
                    size_presets: dimensionsToSend,
                    use_brand_kit: useBrandKit
                };
                const generationGroup = await authService.fetchAuthenticated('/api/v1/generate', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });

                state.generation_id = generationGroup.id;
                state.generatedDesigns = generationGroup.images_json;
                // state.generatedDesigns = await response.json();

                state.appMode = 'editing';
                state.selectedForEditing = state.generatedDesigns.map(d => d.size_preset); // Select all by default

                // Update dimensions state to reflect the generated designs
                const generatedPresets = state.generatedDesigns.map(d => d.size_preset);
                if (generatedPresets.length === ALL_DIMENSION_VALUES.length &&
                    ALL_DIMENSION_VALUES.every(v => generatedPresets.includes(v))) {
                    state.allFormatsSelected = true;
                    state.selectedDimensions = [];
                } else {
                    state.allFormatsSelected = false;
                    state.selectedDimensions = generatedPresets;
                }
                // Style is already set from the user's selection before generating

            } else { // Editing
                addSpinnersToSelectedDesigns();
                const body = {
                    edit_prompt: state.prompt,
                    generation_id: state.generation_id,
                    size_presets: state.selectedForEditing
                };
                const updatedGenerationGroup = await authService.fetchAuthenticated('/api/refine', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
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
            if (error.message === 'SESSION_EXPIRED') {
                return;
            }
            // For any other error, show the user a message.
            console.error('Generation/Refinement error:', error);
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
            const endpoint = `/users/history/design?generation_id=${editId}`;
            const generationGroup = await authService.fetchAuthenticated(endpoint, { method: 'GET' });

            state.appMode = 'editing';
            state.generation_id = generationGroup.id;

            // CORRECTED: Directly use the images_json array without creating redundant data
            state.generatedDesigns = generationGroup.images_json;

            // Pre-select all designs in the loaded group for editing by their size_preset
            state.selectedForEditing = state.generatedDesigns.map(d => d.size_preset);

            // Update dimensions state to reflect the loaded designs
            const loadedPresets = state.generatedDesigns.map(d => d.size_preset);
            if (loadedPresets.length === ALL_DIMENSION_VALUES.length &&
                ALL_DIMENSION_VALUES.every(v => loadedPresets.includes(v))) {
                state.allFormatsSelected = true;
                state.selectedDimensions = [];
            } else {
                state.allFormatsSelected = false;
                state.selectedDimensions = loadedPresets;
            }

            // Update style state if the generation group has a theme
            if (generationGroup.theme) {
                state.selectedStyle = generationGroup.theme;
            }

        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') {
                return;
            }
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

