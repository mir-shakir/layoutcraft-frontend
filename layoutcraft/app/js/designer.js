console.log("designer.js script loading...");
import { authService } from "../shared/js/authService.js";

(function () {
    'use strict';

    // --- STATE MANAGEMENT ---
    const state = {
        appMode: 'generating', // 'generating' or 'editing'
        generatedDesigns: [],
        selectedForEditing: [],
        prompt: '',
        selectedDimensions: [],
        selectedStyle: 'auto',
        selectedQuality: 'pro',
        isGenerating: false,
        anonymousGenerationsRemaining: 3,
        isLoggedIn: false,
        hasUsedFreePro: false,
        errorMessage: null,
        failedAttempts: 0,
    };

    const PROMPT_MAX_LENGTH = 500;

    // --- DOM ELEMENT CACHE ---
    const elements = {
        promptInput: document.getElementById('prompt-input'),
        charIndicator: document.querySelector('.designer-toolbar .char-indicator'),
        generateBtn: document.getElementById('generate-btn'),
        canvasStates: {
            empty: document.getElementById('empty-canvas'),
            loading: document.getElementById('loading-canvas'),
            error: document.getElementById('error-canvas'),
        },
        resultsHeader: document.getElementById('results-header'),
        resultsContainerWrapper: document.getElementById('results-container-wrapper'),
        resultsContainer: document.getElementById('results-container'),
        dimensionsDropdownContainer: document.getElementById('dimensions-dropdown-container'),
        styleDropdownContainer: document.getElementById('style-dropdown-container'),
        errorMessageText: document.getElementById('error-message'),
        loadingMessageText: document.getElementById('loading-message'),
        loadingTipText: document.getElementById('loading-tip'),
        progressBar: document.getElementById('progress-bar'),
    };

    // --- INITIALIZATION ---
    function init() {
        console.log("LayoutCraft Designer Initialized");
        setupEventListeners();
        renderDropdowns();
        checkAuthStatus();
        loadDraft();
        renderUI();
        setupKeyboardShortcuts();
    }

    // --- DROPDOWN RENDERING ---
    function renderDropdowns() {
        console.log("Rendering dropdowns...");
        if (!elements.styleDropdownContainer || !elements.dimensionsDropdownContainer) {
            console.error("Dropdown containers not found in the DOM!");
            return;
        }

        const styleOptions = [
            { value: 'auto', label: '✨ Auto' },
            { value: 'glassmorphism_premium', label: 'Glassmorphism' },
            { value: 'bold_geometric_solid', label: 'Bold Geometric' },
            { value: 'textured_organic_patterns', label: 'Organic' },
            { value: 'minimal_luxury_space', label: 'Minimal' },
            { value: 'vibrant_gradient_energy', label: 'Vibrant' },
            { value: 'dark_neon_tech', label: 'Neon Tech' },
            { value: 'editorial_magazine_layout', label: 'Editorial' },
        ];

        const dimensionOptions = [
            { value: 'blog_header', label: 'Blog Header (1200x630)' },
            { value: 'social_square', label: 'Social Post (1080x1080)' },
            { value: 'story', label: 'Story (1080x1920)' },
            { value: 'twitter_post', label: 'Twitter Post (1024x512)' },
            { value: 'youtube_thumbnail', label: 'YouTube Thumbnail (1280x720)' },
            { value: 'presentation_slide', label: 'Presentation (1920x1080)' },
        ];

        createDropdown(
            elements.styleDropdownContainer, 'Style', styleOptions, state.selectedStyle,
            (value) => {
                state.selectedStyle = value;
                saveDraft();
            },
            false // Not multi-select
        );

        createDropdown(
            elements.dimensionsDropdownContainer, 'Dimensions', dimensionOptions, state.selectedDimensions,
            (value, isSelected) => {
                if (isSelected) {
                    if (!state.selectedDimensions.includes(value)) state.selectedDimensions.push(value);
                } else {
                    state.selectedDimensions = state.selectedDimensions.filter(d => d !== value);
                }
                renderUI(); // Re-render to update button state
                saveDraft();
            },
            true // Multi-select
        );
    }

    function createDropdown(container, label, options, selectedValue, onChange, isMultiSelect) {
        container.innerHTML = '';
        const dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';
        const button = document.createElement('button');
        button.className = 'btn btn-secondary dropdown-toggle';
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';

        const updateButtonLabel = () => {
            if (isMultiSelect) {
                const selectedCount = state.selectedDimensions.length;
                button.textContent = selectedCount > 0 ? `${label} (${selectedCount})` : label;
            } else {
                const selectedOption = options.find(opt => opt.value === state.selectedStyle);
                button.textContent = selectedOption ? selectedOption.label : label;
            }
        };

        options.forEach(option => {
            const item = document.createElement('a');
            item.className = 'dropdown-item';
            if (isMultiSelect) {
                item.innerHTML = `<input type="checkbox" id="dd-${option.value}" value="${option.value}" ${selectedValue.includes(option.value) ? 'checked' : ''}> <label for="dd-${option.value}">${option.label}</label>`;
                item.querySelector('input').addEventListener('change', (e) => {
                    onChange(option.value, e.target.checked);
                });
            } else {
                item.textContent = option.label;
                item.dataset.value = option.value;
                if (option.value === selectedValue) item.classList.add('active');
                item.addEventListener('click', () => {
                    onChange(option.value);
                    menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    updateButtonLabel();
                    menu.classList.remove('show');
                });
            }
            menu.appendChild(item);
        });

        updateButtonLabel();
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        dropdown.appendChild(button);
        dropdown.appendChild(menu);
        container.appendChild(dropdown);
        window.addEventListener('click', () => menu.classList.remove('show'));
    }

    // --- GALLERY RENDERING ---
    function renderResults() {
        elements.resultsContainer.innerHTML = '';
        if (state.generatedDesigns.length === 0) {
            showCanvas('empty');
            return;
        }
        state.generatedDesigns.forEach(design => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.dataset.id = design.id;
            if (state.selectedForEditing.includes(design.id)) card.classList.add('selected');

            card.innerHTML = `
                <img src="${design.image_url}" class="result-card-image" alt="${design.prompt}">
                <div class="result-actions-strip">
                    <button class="btn btn-sm btn-select">Select</button>
                    <button class="btn btn-sm btn-download">Download</button>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-download')) {
                    // Handle download
                    console.log("Download:", design.id);
                    return;
                }
                const id = design.id;
                if (state.selectedForEditing.includes(id)) {
                    state.selectedForEditing = state.selectedForEditing.filter(selectedId => selectedId !== id);
                } else {
                    state.selectedForEditing.push(id);
                }
                renderResults(); // Re-render to update selection state on all cards
                renderUI();
            });
            elements.resultsContainer.appendChild(card);
        });
        showCanvas('results');
    }

    // --- EVENT LISTENERS & UI ---
    function setupEventListeners() {
        elements.promptInput.addEventListener('input', handlePromptInput);
        elements.generateBtn.addEventListener('click', performAction);
        document.getElementById('retry-btn').addEventListener('click', () => {
            showCanvas('empty');
            renderUI();
        });
        document.addEventListener('authChange', () => {
            checkAuthStatus();
            if (elements.canvasStates.error.style.display !== 'none') {
                showCanvas('empty');
                state.failedAttempts = 0;
            }
        });
    }

    function renderUI() {
        const { appMode, prompt, isGenerating, selectedForEditing, generatedDesigns, selectedDimensions } = state;
        const { generateBtn, promptInput, resultsHeader } = elements;
        const generateBtnText = generateBtn.querySelector('.generate-text');

        if (appMode === 'editing') {
            promptInput.placeholder = "Describe the change you want to make...";
            const selectionCount = selectedForEditing.length;
            generateBtnText.textContent = selectionCount > 0 ? `Refine ${selectionCount} Design${selectionCount > 1 ? 's' : ''}` : 'Refine';

            resultsHeader.innerHTML = '';
            const startNewBtn = document.createElement('button');
            startNewBtn.className = 'btn btn-secondary';
            startNewBtn.textContent = 'Start New';
            startNewBtn.onclick = handleStartNew;
            resultsHeader.appendChild(startNewBtn);
            // download all button would go here
        } else {
            promptInput.placeholder = "Describe your design idea...";
            generateBtnText.textContent = 'Generate';
        }
        const isPromptValid = prompt.trim().length > 0;
        const hasSelection = appMode === 'generating' ? selectedDimensions.length > 0 : selectedForEditing.length > 0;
        generateBtn.disabled = !isPromptValid || isGenerating || !hasSelection;
    }

    function handleStartNew() {
        state.appMode = 'generating';
        state.generatedDesigns = [];
        state.selectedForEditing = [];
        state.prompt = '';
        elements.promptInput.value = '';
        showCanvas('empty');
        renderUI();
    }

    function handlePromptInput(e) {
        state.prompt = e.target.value;
        updateCharCount();
        renderUI();
        saveDraft();
    }

    function updateCharCount() {
        const length = state.prompt.length;
        const countText = `${length}/${PROMPT_MAX_LENGTH}`;
        elements.charIndicator.textContent = countText;
        elements.charIndicator.style.color = length > PROMPT_MAX_LENGTH ? '#dc2626' : '#9ca3af';
    }

    function showCanvas(canvasName) {
        Object.values(elements.canvasStates).forEach(canvas => canvas.style.display = 'none');
        elements.resultsContainerWrapper.style.display = 'none';
        elements.resultsHeader.style.display = 'none';
        if (canvasName === 'results') {
            elements.resultsContainerWrapper.style.display = 'block';
            elements.resultsHeader.style.display = 'flex';
        } else if (elements.canvasStates[canvasName]) {
            elements.canvasStates[canvasName].style.display = 'flex';
        }
    }

    // --- AUTH & API ---
    function checkAuthStatus() {
        state.isLoggedIn = authService.hasToken();
        state.hasUsedFreePro = localStorage.getItem('layoutcraft_pro_used') === 'true';
    }

    async function performAction() {
        if (state.isGenerating) return;
        if (state.appMode === 'generating') {
            if (state.prompt.trim().length < 10) return showError("Please provide a more detailed description.");
            if (state.selectedDimensions.length === 0) return showError("Please select at least one dimension.");
        } else {
            if (state.prompt.trim().length === 0) return showError("Please describe the change you want to make.");
            if (state.selectedForEditing.length === 0) return showError("Please select at least one design to refine.");
        }
        state.isGenerating = true;
        setButtonsLoading(true);
        showCanvas('loading');
        startLoadingAnimation();
        renderUI();
        try {
            if (state.appMode === 'generating') await generateDesigns();
            else await refineDesigns();
            state.failedAttempts = 0;
            state.prompt = '';
            elements.promptInput.value = '';
        } catch (error) {
            console.error('Action failed:', error);
            state.failedAttempts++;
            showError(formatErrorMessage(error));
        } finally {
            state.isGenerating = false;
            stopLoadingAnimation();
            setButtonsLoading(false);
            renderUI();
            checkAuthStatus();
        }
    }

    async function generateDesigns() {
        const headers = { 'Content-Type': 'application/json' };
        if (authService.hasToken()) headers['Authorization'] = `Bearer ${authService.getToken()}`;
        const endpoint = `${authService.apiBaseUrl}/api/v1/generate`;
        const body = JSON.stringify({
            prompt: state.prompt.trim(),
            model: state.selectedQuality === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
            theme: state.selectedStyle,
            size_presets: state.selectedDimensions
        });
        const response = await fetch(endpoint, { method: 'POST', headers, body });
        if (!response.ok) throw new Error((await response.json()).detail || 'Failed to generate designs.');
        const resultData = await response.json();
        state.generatedDesigns = resultData;
        state.appMode = 'editing';
        state.selectedForEditing = resultData.map(design => design.id);
        renderResults();
    }

    async function refineDesigns() {
        if (!authService.hasToken()) return showError("Please log in to refine designs.");
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authService.getToken()}` };
        const endpoint = `${authService.apiBaseUrl}/designs/refine`;
        const body = JSON.stringify({
            edit_prompt: state.prompt.trim(),
            design_ids: state.selectedForEditing
        });
        const response = await fetch(endpoint, { method: 'POST', headers, body });
        if (!response.ok) throw new Error((await response.json()).detail || 'Failed to refine designs.');
        const updatedDesigns = await response.json();
        updatedDesigns.forEach(updatedDesign => {
            const index = state.generatedDesigns.findIndex(d => d.id === updatedDesign.id);
            if (index !== -1) state.generatedDesigns[index] = updatedDesign;
        });
        renderResults();
    }

    function formatErrorMessage(error) {
        const message = error.message || error.toString();
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'Unable to connect to servers. Please check your internet connection.';
        if (message.includes('429') || message.includes('rate limit')) return 'Too many requests. Please wait a moment and try again.';
        if (message.includes('500') || message.includes('502') || message.includes('503')) return 'Our servers are experiencing issues. Please try again in a few minutes.';
        return message;
    }

    function setButtonsLoading(isLoading) {
        elements.generateBtn.classList.toggle('loading', isLoading);
    }

    // --- PERSISTENCE ---
    function loadDraft() {
        try {
            const draft = localStorage.getItem('layoutcraft_designer_draft');
            if (draft) {
                const data = JSON.parse(draft);
                state.prompt = data.prompt || '';
                state.selectedDimensions = data.dimensions || [];
                state.selectedStyle = data.style || 'auto';
                state.selectedQuality = data.quality || 'pro';
                elements.promptInput.value = state.prompt;
                renderDropdowns();
                updateCharCount();
            }
        } catch (e) { console.warn("Could not load draft.", e); }
    }

    function saveDraft() {
        try {
            const draft = {
                prompt: state.prompt,
                dimensions: state.selectedDimensions,
                style: state.selectedStyle,
                quality: state.selectedQuality,
            };
            localStorage.setItem('layoutcraft_designer_draft', JSON.stringify(draft));
        } catch (e) { console.warn("Could not save draft.", e); }
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                performAction();
            }
        });
    }

    // --- LOADING ANIMATION ---
    let progressInterval, messageInterval;
    function startLoadingAnimation() {
        // ... implementation ...
    }
    function stopLoadingAnimation() {
        // ... implementation ...
    }

    // --- RUN INITIALIZATION ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
