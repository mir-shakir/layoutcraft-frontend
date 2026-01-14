/**
 * Workspace Module
 * Handles the Rail + Views navigation for the LayoutCraft SPA workspace.
 * Keeps navigation logic separate from the complex designer logic.
 */

import { authService } from '../../shared/js/authService.js';
import { subscriptionService } from '../../shared/js/subscriptionService.js';

// Google Fonts library for Brand Kit
const GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Playfair Display', 'Outfit', 'Raleway', 'Oswald', 'Source Sans Pro',
    'Ubuntu', 'Nunito', 'Merriweather', 'PT Sans', 'Rubik', 'Work Sans',
    'Quicksand', 'Barlow', 'Mulish', 'Noto Sans', 'Libre Baskerville',
    'DM Sans', 'Manrope', 'Space Grotesk', 'Crimson Text', 'Bitter',
    'Josefin Sans', 'Archivo', 'Fira Sans', 'Source Serif Pro', 'Karla'
];

const FONT_TYPES = ['heading', 'subheading', 'title', 'subtitle', 'body', 'quote', 'caption'];

class WorkspaceManager {
    constructor() {
        this.state = {
            activeView: 'editor', // 'editor' | 'history' | 'brand'
            historyLoaded: false,
            brandKitLoaded: false,
            selectedParentId: null,
            historyState: {
                parentPrompts: [],
                editGroups: {},
                pagination: {
                    offset: 0,
                    hasNext: true,
                    loading: false
                }
            },
            brandKit: {
                colors: { primary: '', secondary: '', accent: '' },
                fonts: {
                    heading: '', subheading: '', title: '',
                    subtitle: '', body: '', quote: '', caption: ''
                },
                guidelines: ''
            },
            hasBrandKit: false, // Whether user has created a brand kit
            brandKitChecked: false // Whether we've checked for brand kit existence
        };

        this.elements = null;
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.populateFontDropdowns();
        this.updateRailActiveState();
        this.checkBrandKitToggleVisibility();
        // Lazy load fonts for preview
        this.loadGoogleFonts();
        console.log('WorkspaceManager initialized');
    }

    loadGoogleFonts() {
        const families = GOOGLE_FONTS.map(font => `family=${font.replace(/ /g, '+')}:wght@400;700`).join('&');
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    // Check if brand kit toggle should be visible and if user has a brand kit
    async checkBrandKitToggleVisibility() {
        const isPro = subscriptionService.isOnTrialOrPro();
        const toggleContainer = document.getElementById('brand-kit-toggle-container');
        const warningEl = document.getElementById('no-brandkit-warning');
        const toggleInput = document.getElementById('use-brand-kit');
        const proLabel = document.getElementById('brandkit-pro-label');

        // Always show toggle for all users
        if (toggleContainer) toggleContainer.style.display = 'flex';

        if (!isPro) {
            // Free users: Show toggle but locked with PRO label
            if (toggleInput) {
                toggleInput.disabled = true;
                toggleInput.checked = false;
            }
            if (proLabel) proLabel.style.display = 'inline-flex';
            if (warningEl) warningEl.style.display = 'none';
            return;
        }

        // Pro users: Hide PRO label
        if (proLabel) proLabel.style.display = 'none';

        // Check if user has created a brand kit (non-blocking)
        if (!this.state.brandKitChecked) {
            try {
                const brandKit = await authService.fetchAuthenticated('/users/brand-kit');
                this.state.hasBrandKit = !!(brandKit && (brandKit.colors || brandKit.fonts || brandKit.guidelines));
                this.state.brandKitChecked = true;
            } catch (error) {
                if (error.status === 404 || error.message?.includes('404')) {
                    this.state.hasBrandKit = false;
                }
                this.state.brandKitChecked = true;
            }
        }

        // Show warning if no brand kit exists
        if (!this.state.hasBrandKit) {
            if (warningEl) {
                warningEl.style.display = 'inline';
                warningEl.textContent = 'Create a brand kit first →';
                warningEl.style.cursor = 'pointer';
                warningEl.onclick = () => this.switchView('brand');
            }
            if (toggleInput) {
                toggleInput.disabled = true;
                toggleInput.checked = false;
            }
        } else {
            if (warningEl) warningEl.style.display = 'none';
            if (toggleInput) toggleInput.disabled = false;
        }
    }

    cacheElements() {
        this.elements = {
            rail: document.getElementById('workspace-rail'),
            railItems: document.querySelectorAll('.rail-item'),
            views: {
                editor: document.getElementById('view-editor'),
                history: document.getElementById('view-history'),
                brand: document.getElementById('view-brand')
            },
            // History Sidebar elements
            historySidebarLoading: document.getElementById('history-sidebar-loading'),
            historySidebarEmpty: document.getElementById('history-sidebar-empty'),
            historyParentsList: document.getElementById('history-parents-list'),
            historyLoadMore: document.getElementById('history-load-more'),
            // History Canvas elements
            historyCanvasEmpty: document.getElementById('history-canvas-empty'),
            historyCanvasLoading: document.getElementById('history-canvas-loading'),
            historyEditGroups: document.getElementById('history-edit-groups'),
            // Image Preview Modal
            imagePreviewModal: document.getElementById('image-preview-modal'),
            previewImage: document.getElementById('preview-image'),
            // Mobile Drawer
            mobileDrawer: document.getElementById('mobile-edit-drawer'),
            drawerTitle: document.getElementById('drawer-title'),
            drawerEditGroups: document.getElementById('drawer-edit-groups'),
            // Upgrade Modal
            upgradeModal: document.getElementById('upgrade-modal'),
            upgradeModalTitle: document.getElementById('upgrade-modal-title'),
            upgradeModalMessage: document.getElementById('upgrade-modal-message'),
            // Brand Kit elements
            brandPrimary: document.getElementById('brand-primary'),
            brandSecondary: document.getElementById('brand-secondary'),
            brandAccent: document.getElementById('brand-accent'),
            brandGuidelines: document.getElementById('brand-guidelines'),
            guidelinesCount: document.getElementById('guidelines-count'),
            saveBrandKit: document.getElementById('save-brand-kit')
        };

        // Cache font dropdowns
        this.fontElements = {};
        FONT_TYPES.forEach(type => {
            this.fontElements[type] = document.getElementById(`brand-font-${type}`);
        });
    }

    setupEventListeners() {
        // Rail navigation
        this.elements.railItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // History load more
        if (this.elements.historyLoadMore) {
            this.elements.historyLoadMore.addEventListener('click', () => this.loadMoreHistory());
        }

        // Brand Kit save
        if (this.elements.saveBrandKit) {
            this.elements.saveBrandKit.addEventListener('click', () => this.saveBrandKit());
        }

        // Guidelines character counter
        if (this.elements.brandGuidelines) {
            this.elements.brandGuidelines.addEventListener('input', (e) => {
                const count = e.target.value.length;
                if (this.elements.guidelinesCount) {
                    this.elements.guidelinesCount.textContent = count;
                }
            });
        }

        // Color picker input group events (Color Input + Hex Input + Clear Button)
        const colorGroups = [
            { input: this.elements.brandPrimary, id: 'brand-primary' },
            { input: this.elements.brandSecondary, id: 'brand-secondary' },
            { input: this.elements.brandAccent, id: 'brand-accent' }
        ];

        colorGroups.forEach(group => {
            const colorInput = group.input;
            if (!colorInput) return;

            const wrapper = colorInput.parentElement;
            const hexInput = wrapper.querySelector('.hex-input');
            const clearBtn = wrapper.querySelector('.clear-color-btn');

            // 1. Color Picker -> Hex Input
            colorInput.addEventListener('input', (e) => {
                if (hexInput) {
                    hexInput.value = e.target.value;
                    hexInput.classList.remove('invalid');
                }
            });

            // 2. Hex Input -> Color Picker
            if (hexInput) {
                hexInput.addEventListener('input', (e) => {
                    const hex = e.target.value;
                    // Auto-add # if missing and length is appropriate
                    if (hex.length === 6 && !hex.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(hex)) {
                        e.target.value = '#' + hex;
                        colorInput.value = '#' + hex;
                        e.target.classList.remove('invalid');
                        return;
                    }

                    // Validate Hex
                    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
                        colorInput.value = hex;
                        e.target.classList.remove('invalid');
                    } else {
                        // Don't update color picker if invalid
                        // Optional: Add visual feedback
                        if (hex.length > 0) e.target.classList.add('invalid');
                    }
                });

                // Format on blur
                hexInput.addEventListener('blur', (e) => {
                    const hex = e.target.value;
                    if (!hex) return; // Allow empty
                    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
                        // Reset to color picker value if invalid on blur? Or keep as is?
                        // User said "prevent saving invalid". We'll handle that in save.
                    }
                });
            }

            // 3. Clear Button
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (hexInput) hexInput.value = '';
                    // We don't really "unset" the color input, it always has a value.
                    // But saving will check the hex input.
                });
            }
        });

        // Brand Kit toggle - show upgrade modal for free users
        const toggleContainer = document.getElementById('brand-kit-toggle-container');
        if (toggleContainer) {
            toggleContainer.addEventListener('click', (e) => {
                if (!subscriptionService.isOnTrialOrPro()) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showUpgradeModal('Use Brand Kit', 'Apply your brand colors, fonts, and guidelines to all your designs. Upgrade to Pro to unlock!');
                }
            });
        }

        // Listen for design load events (from history to editor)
        document.addEventListener('loadDesignIntoEditor', () => {
            this.switchView('editor');
        });
    }

    populateFontDropdowns() {
        FONT_TYPES.forEach(type => {
            const select = this.fontElements[type];
            if (select) {
                // Add empty option first, then font options with preview styles
                const options = ['<option value="">Not selected</option>'];
                options.push(...GOOGLE_FONTS.map(font =>
                    `<option value="${font}" style="font-family: '${font}', sans-serif;">${font}</option>`
                ));
                select.innerHTML = options.join('');
            }
        });
    }

    switchView(viewName) {
        if (this.state.activeView === viewName) return;

        // Hide all views
        Object.values(this.elements.views).forEach(view => {
            if (view) view.style.display = 'none';
        });

        // Show target view
        if (this.elements.views[viewName]) {
            this.elements.views[viewName].style.display = 'block';
        }

        this.state.activeView = viewName;
        this.updateRailActiveState();

        // Lazy load content for views
        if (viewName === 'history' && !this.state.historyLoaded) {
            this.loadHistory();
        }
        if (viewName === 'brand') {
            this.handleBrandKitView();
        }
    }

    handleBrandKitView() {
        const isPro = subscriptionService.isOnTrialOrPro();
        const container = this.elements.views.brand;
        const lockedOverlay = document.getElementById('brand-kit-locked');
        const formContent = container?.querySelector('.brand-kit-content');

        if (!isPro) {
            // Show locked overlay for free users
            if (lockedOverlay) lockedOverlay.style.display = 'flex';
            if (formContent) formContent.classList.add('locked-blur');
        } else {
            // Pro users get full access
            if (lockedOverlay) lockedOverlay.style.display = 'none';
            if (formContent) formContent.classList.remove('locked-blur');
            if (!this.state.brandKitLoaded) {
                this.loadBrandKit();
            }
        }
    }

    updateRailActiveState() {
        this.elements.railItems.forEach(item => {
            if (item.dataset.view === this.state.activeView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // ==================== HISTORY FUNCTIONALITY ====================

    async loadHistory(offset = 0) {
        if (this.state.historyState.pagination.loading) return;

        this.state.historyState.pagination.loading = true;

        if (offset === 0) {
            this.showSidebarLoading();
        }

        try {
            const data = await authService.fetchAuthenticated(`/users/history/parents?offset=${offset}&limit=10`);

            if (offset === 0) {
                this.state.historyState.parentPrompts = data.parents || [];
            } else {
                this.state.historyState.parentPrompts.push(...(data.parents || []));
            }

            this.state.historyState.pagination.offset = offset + 10;
            this.state.historyState.pagination.hasNext = data.has_next || false;
            this.state.historyLoaded = true;

            if (this.state.historyState.parentPrompts.length === 0) {
                this.showSidebarEmpty();
            } else {
                this.renderParentsList();
            }
        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') return;
            console.error('Error loading history:', error);
            this.showToast('Could not load your designs. Please try again.', 'error');
        } finally {
            this.state.historyState.pagination.loading = false;
        }
    }

    async loadMoreHistory() {
        if (!this.state.historyState.pagination.hasNext) return;
        if (this.state.historyState.pagination.loading) return;

        const loadMoreBtn = this.elements.historyLoadMore;
        const originalHTML = loadMoreBtn?.innerHTML;
        const previousCount = this.state.historyState.parentPrompts.length;

        // Show loading state
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = `
                <span class="loading-spinner-small"></span>
                Loading...
            `;
        }

        // Add timeout handling
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 10000);
        });

        try {
            await Promise.race([
                this.loadHistory(this.state.historyState.pagination.offset),
                timeoutPromise
            ]);

            // Scroll to reveal new content
            const newCount = this.state.historyState.parentPrompts.length;
            if (newCount > previousCount) {
                // Small delay for DOM update
                setTimeout(() => {
                    const parentsList = this.elements.historyParentsList;
                    if (parentsList) {
                        const lastItem = parentsList.querySelector('.parent-item:last-child');
                        if (lastItem) {
                            lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Load more failed:', error);
            this.showToast('Could not load more designs. Tap to retry.', 'error');
        } finally {
            // Restore button state
            if (loadMoreBtn && originalHTML) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = originalHTML;
            }
        }
    }

    showSidebarLoading() {
        if (this.elements.historySidebarLoading) this.elements.historySidebarLoading.style.display = 'flex';
        if (this.elements.historySidebarEmpty) this.elements.historySidebarEmpty.style.display = 'none';
        if (this.elements.historyParentsList) this.elements.historyParentsList.style.display = 'none';
    }

    showSidebarEmpty() {
        if (this.elements.historySidebarLoading) this.elements.historySidebarLoading.style.display = 'none';
        if (this.elements.historySidebarEmpty) this.elements.historySidebarEmpty.style.display = 'flex';
        if (this.elements.historyParentsList) this.elements.historyParentsList.style.display = 'none';
    }

    renderParentsList() {
        if (this.elements.historySidebarLoading) this.elements.historySidebarLoading.style.display = 'none';
        if (this.elements.historySidebarEmpty) this.elements.historySidebarEmpty.style.display = 'none';
        if (this.elements.historyParentsList) this.elements.historyParentsList.style.display = 'block';

        const list = this.elements.historyParentsList;
        if (!list) return;

        list.innerHTML = '';

        this.state.historyState.parentPrompts.forEach(parent => {
            const item = this.createParentItem(parent);
            list.appendChild(item);
        });

        // Update load more button container visibility
        const loadMoreBtn = this.elements.historyLoadMore;
        const loadMoreContainer = loadMoreBtn?.parentElement;
        if (loadMoreContainer) {
            loadMoreContainer.style.display =
                this.state.historyState.pagination.hasNext ? 'block' : 'none';
        }
    }

    createParentItem(parent) {
        const item = document.createElement('div');
        item.className = 'parent-item';
        item.dataset.threadId = parent.design_thread_id;

        if (this.state.selectedParentId === parent.design_thread_id) {
            item.classList.add('active');
        }

        const thumbnailUrl = parent.thumbnail_url || '/app/history/placeholder-thumbnail.svg';
        const prompt = this.escapeHtml(parent.original_prompt);
        const truncatedPrompt = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;

        item.innerHTML = `
            <img src="${thumbnailUrl}" alt="Thumbnail" class="parent-thumb" 
                 onerror="this.src='/app/history/placeholder-thumbnail.svg'">
            <div class="parent-info">
                <p class="parent-prompt-text">${truncatedPrompt}</p>
                <span class="parent-meta">${parent.edit_groups_count} variation${parent.edit_groups_count !== 1 ? 's' : ''}</span>
            </div>
        `;

        item.addEventListener('click', () => this.selectParent(parent));
        return item;
    }

    async fetchEditGroups(threadId) {
        // Check cache first
        if (this.state.historyState.editGroups[threadId]) {
            return this.state.historyState.editGroups[threadId];
        }

        const data = await authService.fetchAuthenticated(
            `/users/history/edit-groups?thread_id=${threadId}`
        );
        this.state.historyState.editGroups[threadId] = data.edit_groups || [];
        return this.state.historyState.editGroups[threadId];
    }

    async selectParent(parent) {
        // Update selection state
        this.state.selectedParentId = parent.design_thread_id;

        // Update sidebar UI
        document.querySelectorAll('.parent-item').forEach(item => {
            item.classList.toggle('active', item.dataset.threadId === parent.design_thread_id);
        });

        // On mobile, open drawer instead of rendering in canvas
        if (this.isMobile()) {
            await this.openMobileDrawer(parent.design_thread_id, parent.original_prompt);
            return;
        }

        // Desktop: Show loading in canvas
        this.showCanvasLoading();

        try {
            // Check if we already have the edit groups cached
            if (!this.state.historyState.editGroups[parent.design_thread_id]) {
                const data = await authService.fetchAuthenticated(
                    `/users/history/edit-groups?thread_id=${parent.design_thread_id}`
                );
                this.state.historyState.editGroups[parent.design_thread_id] = data.edit_groups || [];
            }

            this.renderEditGroups(parent);
        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') return;
            console.error('Error loading edit groups:', error);
            this.showToast('Could not load designs. Please try again.', 'error');
            this.showCanvasEmpty();
        }
    }

    showCanvasLoading() {
        if (this.elements.historyCanvasEmpty) this.elements.historyCanvasEmpty.style.display = 'none';
        if (this.elements.historyCanvasLoading) this.elements.historyCanvasLoading.style.display = 'flex';
        if (this.elements.historyEditGroups) this.elements.historyEditGroups.style.display = 'none';
    }

    showCanvasEmpty() {
        if (this.elements.historyCanvasEmpty) this.elements.historyCanvasEmpty.style.display = 'flex';
        if (this.elements.historyCanvasLoading) this.elements.historyCanvasLoading.style.display = 'none';
        if (this.elements.historyEditGroups) this.elements.historyEditGroups.style.display = 'none';
    }

    renderEditGroups(parent) {
        if (this.elements.historyCanvasEmpty) this.elements.historyCanvasEmpty.style.display = 'none';
        if (this.elements.historyCanvasLoading) this.elements.historyCanvasLoading.style.display = 'none';
        if (this.elements.historyEditGroups) this.elements.historyEditGroups.style.display = 'block';

        const container = this.elements.historyEditGroups;
        if (!container) return;

        const editGroups = this.state.historyState.editGroups[parent.design_thread_id] || [];

        container.innerHTML = `
            <div class="edit-groups-header">
                <div class="header-info">
                    <h2 class="original-prompt">${this.escapeHtml(parent.original_prompt)}</h2>
                    <span class="groups-count">${editGroups.length} variation${editGroups.length !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="edit-groups-list">
                ${editGroups.map(group => this.createEditGroupCard(group, parent)).join('')}
            </div>
        `;
    }

    createEditGroupCard(group, parent) {
        const date = this.formatDate(group.created_at);
        const designsHtml = group.images_json.map(img => `
            <div class="design-card">
                <img src="${img.image_url}" alt="${img.size_preset}" class="design-thumbnail"
                     onclick="workspaceManager.openImagePreview('${img.image_url}')">
                <div class="design-card-info">
                    <span class="design-size">${img.size_preset.replace(/_/g, ' ')}</span>
                    <div class="design-actions">
                        <button class="design-action-btn preview-btn" onclick="workspaceManager.openImagePreview('${img.image_url}')" title="Preview">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="design-action-btn download-btn" onclick="workspaceManager.downloadImage('${img.image_url}', '${img.size_preset}')" title="Download">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7,10 12,15 17,10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div class="edit-group-card" data-generation-id="${group.generation_id}">
                <div class="edit-group-header">
                    <div class="edit-group-info">
                        <p class="edit-group-prompt">${this.escapeHtml(group.prompt)}</p>
                        <div class="edit-group-meta">
                            <span class="prompt-type ${group.prompt_type}">${group.prompt_type}</span>
                            <span class="edit-group-date">${date}</span>
                        </div>
                    </div>
                </div>
                <div class="designs-scroll">
                    ${designsHtml}
                </div>
                <div class="edit-group-actions">
                    <span class="designs-count">${group.images_json.length} design${group.images_json.length !== 1 ? 's' : ''}</span>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="workspaceManager.editGroup('${group.generation_id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Group ${!subscriptionService.isOnTrialOrPro() ? '🔒' : ''}
                        </button>
                        <button class="action-btn download-all-btn" onclick="workspaceManager.downloadAllImages('${group.generation_id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7,10 12,15 17,10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download All
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Image Preview Modal
    openImagePreview(imageUrl) {
        if (this.elements.previewImage) {
            this.elements.previewImage.src = imageUrl;
        }
        if (this.elements.imagePreviewModal) {
            this.elements.imagePreviewModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeImagePreview() {
        if (this.elements.imagePreviewModal) {
            this.elements.imagePreviewModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Download functionality
    async downloadImage(imageUrl, sizePreset) {
        try {
            const filename = `layoutcraft_${sizePreset}_${Date.now()}.png`;
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            this.showToast('Download failed. Please try again.', 'error');
        }
    }

    async downloadAllImages(generationId) {
        const editGroups = Object.values(this.state.historyState.editGroups).flat();
        const group = editGroups.find(g => g.generation_id === generationId);
        if (!group) return;

        const button = event.target.closest('.download-all-btn');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="mini-spinner"></span> Downloading...';
        }

        try {
            for (let i = 0; i < group.images_json.length; i++) {
                const img = group.images_json[i];
                await this.downloadImage(img.image_url, `${img.size_preset}_${i + 1}`);
                if (i < group.images_json.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            this.showToast('All designs downloaded!', 'success');
        } catch (error) {
            this.showToast('Download failed. Please try again.', 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download All
                `;
            }
        }
    }

    editGroup(generationId) {
        if (!subscriptionService.isOnTrialOrPro()) {
            this.showUpgradeModal('Edit Group', 'Loading past designs for editing is a Pro feature. Upgrade to continue editing this design with your original settings and style!');
            return;
        }

        // Dispatch event to load into editor
        const editGroups = Object.values(this.state.historyState.editGroups).flat();
        const group = editGroups.find(g => g.generation_id === generationId);

        if (group) {
            document.dispatchEvent(new CustomEvent('loadDesign', {
                detail: {
                    generation_id: group.generation_id,
                    images_json: group.images_json,
                    theme: group.theme || 'auto',
                    prompt: group.prompt
                }
            }));
            this.switchView('editor');
        }
    }

    // ==================== BRAND KIT FUNCTIONALITY ====================

    async loadBrandKit() {
        try {
            const brandKit = await authService.fetchAuthenticated('/users/brand-kit');
            this.state.brandKit = brandKit;
            this.populateBrandKitForm(brandKit);
            this.state.brandKitLoaded = true;
        } catch (error) {
            if (error.status === 404 || error.message?.includes('404')) {
                // First time - use defaults
                this.state.brandKitLoaded = true;
                return;
            }
            if (error.message === 'SESSION_EXPIRED') return;
            console.error('Error loading brand kit:', error);
        }
    }

    populateBrandKitForm(brandKit) {
        // Colors
        // Colors
        if (this.elements.brandPrimary) {
            const val = brandKit.colors?.primary || '';
            const wrapper = this.elements.brandPrimary.parentElement;
            const hexInput = wrapper.querySelector('.hex-input');
            if (hexInput) hexInput.value = val;
            if (val) this.elements.brandPrimary.value = val;
        }
        if (this.elements.brandSecondary) {
            const val = brandKit.colors?.secondary || '';
            const wrapper = this.elements.brandSecondary.parentElement;
            const hexInput = wrapper.querySelector('.hex-input');
            if (hexInput) hexInput.value = val;
            if (val) this.elements.brandSecondary.value = val;
        }
        if (this.elements.brandAccent) {
            const val = brandKit.colors?.accent || '';
            const wrapper = this.elements.brandAccent.parentElement;
            const hexInput = wrapper.querySelector('.hex-input');
            if (hexInput) hexInput.value = val;
            if (val) this.elements.brandAccent.value = val;
        }

        // Fonts
        FONT_TYPES.forEach(type => {
            const select = this.fontElements[type];
            if (select && brandKit.fonts?.[type]) {
                select.value = brandKit.fonts[type];
            }
        });

        // Guidelines
        if (this.elements.brandGuidelines && brandKit.guidelines) {
            this.elements.brandGuidelines.value = brandKit.guidelines;
            if (this.elements.guidelinesCount) {
                this.elements.guidelinesCount.textContent = brandKit.guidelines.length;
            }
        }
    }

    async saveBrandKit() {
        const btn = this.elements.saveBrandKit;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Saving...';
        }

        const fonts = {};
        FONT_TYPES.forEach(type => {
            fonts[type] = this.fontElements[type]?.value || '';
        });

        // Helper to get hex value
        const getHex = (input) => {
            const wrapper = input?.parentElement;
            const hexInput = wrapper?.querySelector('.hex-input');
            return hexInput?.value || '';
        };

        const brandKit = {
            colors: {
                primary: getHex(this.elements.brandPrimary),
                secondary: getHex(this.elements.brandSecondary),
                accent: getHex(this.elements.brandAccent)
            },
            fonts: fonts,
            guidelines: this.elements.brandGuidelines?.value || ''
        };

        // Validation: Check for invalid hex inputs
        const invalidInputs = document.querySelectorAll('.hex-input.invalid');
        if (invalidInputs.length > 0) {
            this.showToast('Please fix invalid hex color values before saving.', 'error');
            // Re-enable button
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            }
            return;
        }

        try {
            await authService.fetchAuthenticated('/users/brand-kit', {
                method: 'POST',
                body: JSON.stringify(brandKit)
            });

            this.state.brandKit = brandKit;
            this.state.hasBrandKit = true;
            this.showToast('Brand Kit saved successfully!', 'success');

            // Refresh toggle visibility in editor now that brand kit exists
            this.checkBrandKitToggleVisibility();
        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') return;
            console.error('Error saving brand kit:', error);
            this.showToast('Could not save Brand Kit. Please try again.', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            }
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `workspace-toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==================== MOBILE DRAWER ====================

    isMobile() {
        return window.innerWidth <= 768;
    }

    async openMobileDrawer(threadId, prompt) {
        const drawer = this.elements.mobileDrawer;
        const body = this.elements.drawerEditGroups;
        const title = this.elements.drawerTitle;

        if (!drawer || !body) return;

        // Set title
        if (title) title.textContent = 'Design Variations';

        // Show drawer with loading state
        drawer.style.display = 'flex';
        body.innerHTML = `
            <div class="drawer-loading">
                <div class="loading-spinner-small"></div>
                <span>Loading variations...</span>
            </div>
        `;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        try {
            const editGroups = await this.fetchEditGroups(threadId);
            this.renderDrawerEditGroups(editGroups, body);
        } catch (error) {
            body.innerHTML = `
                <div class="drawer-loading">
                    <span>Could not load variations</span>
                </div>
            `;
        }
    }

    closeMobileDrawer() {
        const drawer = this.elements.mobileDrawer;
        if (drawer) {
            drawer.style.display = 'none';
        }
        document.body.style.overflow = '';
    }

    renderDrawerEditGroups(editGroups, container) {
        if (!editGroups || editGroups.length === 0) {
            container.innerHTML = `
                <div class="drawer-loading">
                    <span>No variations found</span>
                </div>
            `;
            return;
        }

        const isPro = subscriptionService.isOnTrialOrPro();

        // Exact structure from My Designs page (history.js createEditGroupCard)
        container.innerHTML = editGroups.map(group => {
            const images = group.images_json || [];

            return `
                <div class="edit-group-card">
                    <div class="edit-group-header">
                        <div class="edit-group-prompt">${this.escapeHtml(group.prompt || 'Original Design')}</div>
                        <div class="edit-group-meta">
                            <div class="edit-group-date">${this.formatDate(group.created_at)}</div>
                            <div class="prompt-type-badge ${group.prompt_type || 'creation'}">${group.prompt_type || 'creation'}</div>
                        </div>
                    </div>
                    <div class="designs-preview">
                        <div class="designs-scroll-container">
                            ${images.map(img => `
                                <div class="design-card">
                                    <img src="${img.image_url}" 
                                         alt="${img.size_preset}" 
                                         class="design-thumbnail"
                                         onclick="workspaceManager.openImagePreview('${img.image_url}')">
                                    <div class="design-card-info">
                                        <div class="design-size-label">${img.size_preset.replace(/_/g, ' ')}</div>
                                        <div class="design-actions">
                                            <button class="design-action-btn preview-btn" 
                                                    onclick="workspaceManager.openImagePreview('${img.image_url}')"
                                                    title="Preview">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </button>
                                            <button class="design-action-btn download-btn" 
                                                    onclick="workspaceManager.downloadImage('${img.image_url}', '${img.size_preset}.png')"
                                                    title="Download">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="7,10 12,15 17,10"></polyline>
                                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="edit-group-actions">
                        <div class="designs-count">${images.length} design${images.length !== 1 ? 's' : ''}</div>
                        <div class="group-actions">
                            <button class="group-action-btn edit-group-btn" 
                                    onclick="workspaceManager.editGroup('${group.generation_id}')">
                                Edit Group ${!isPro ? '🔒' : ''}
                            </button>
                            <button class="group-action-btn download-all-btn" 
                                    onclick="workspaceManager.downloadAllImages('${group.generation_id}')">
                                Download All
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== UPGRADE MODAL ====================

    showUpgradeModal(title = 'Pro Feature', message = 'Upgrade to Pro to access this feature.') {
        // Dynamic modal - same approach as designer.js for guaranteed immediate display
        const existingModal = document.getElementById('workspace-upgrade-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="auth-modal-overlay active" id="workspace-upgrade-modal" style="z-index: 10001;">
                <div class="auth-modal-content">
                    <button class="auth-modal-close" type="button">×</button>
                    <h2 class="auth-modal-title">${title}</h2>
                    <p class="auth-modal-subtitle">${message}</p>
                    <a href="/pricing/" class="btn btn-primary" style="width: 100%; text-align: center; margin-top: 1rem;">View Pro Features</a>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('workspace-upgrade-modal');
        modal.querySelector('.auth-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    closeUpgradeModal() {
        const modal = document.getElementById('workspace-upgrade-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Create and export singleton instance
export const workspaceManager = new WorkspaceManager();

// Make it globally accessible for onclick handlers
window.workspaceManager = workspaceManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => workspaceManager.init());
} else {
    workspaceManager.init();
}
