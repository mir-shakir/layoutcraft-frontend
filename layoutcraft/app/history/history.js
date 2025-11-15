import { authService } from '../../shared/js/authService.js';
import { subscriptionService } from '../../shared/js/subscriptionService.js'; 


document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!authService.hasToken() || authService.isTokenExpired()) {
        if (authService.hasToken() && authService.isTokenExpired()) {
            authService.logout();
            document.dispatchEvent(new CustomEvent('authChange'));
        }
        // Show auth modal with custom message
        if (window.layoutCraftNav) {
            window.layoutCraftNav.openAuthModal('login', 'Your session has expired. Please log in again to access your designs.');
        } else {
            // Fallback: redirect if navigation isn't loaded yet
            window.location.href = '/?auth=required';
        }
        return; 
    }

    // --- STATE MANAGEMENT ---
    const state = {
        parentPrompts: [],
        editGroups: {},  // { thread_id: [...edit_groups] }
        expandedThreads: new Set(),
        currentThreadId: null,
        pagination: {
            offset: 0,
            hasNext: true,
            loading: false
        },
        isMobile: window.innerWidth <= 768
    };

    // --- DOM ELEMENTS ---
    const elements = {
        loadingState: document.getElementById('loading-state'),
        emptyState: document.getElementById('empty-state'),
        parentsContainer: document.getElementById('parents-container'),
        loadMoreContainer: document.getElementById('load-more-container'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        loadMoreText: document.querySelector('.load-more-text'),
        loadMoreLoading: document.querySelector('.load-more-loading'),
        editGroupsModal: document.getElementById('edit-groups-modal'),
        modalTitle: document.getElementById('modal-title'),
        closeModal: document.getElementById('close-modal'),
        editGroupsContainer: document.getElementById('edit-groups-container')
    };

    // --- INITIALIZATION ---
    async function init() {
        setupEventListeners();
        await subscriptionService.fetchSubscription(); 
        await fetchParentPrompts();
    }

    function setupEventListeners() {
        // Load more button (NO INFINITE SCROLL)
        elements.loadMoreBtn?.addEventListener('click', handleLoadMore);

        // Modal controls
        elements.closeModal?.addEventListener('click', closeModal);
        elements.editGroupsModal?.addEventListener('click', (e) => {
            if (e.target === elements.editGroupsModal) closeModal();
        });

        // Window resize
        window.addEventListener('resize', () => {
            state.isMobile = window.innerWidth <= 768;
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    // --- API FUNCTIONS ---
    async function fetchParentPrompts(offset = 0) {
        if (state.pagination.loading) return;

        state.pagination.loading = true;
        updateLoadMoreButton(true);

        if (offset === 0) {
            showLoadingState();
        }

        try {
            const data = await authService.fetchAuthenticated(`/users/history/parents?offset=${offset}&limit=20`);


            if (offset === 0) {
                state.parentPrompts = data.parents || [];
            } else {
                state.parentPrompts.push(...(data.parents || []));
            }

            state.pagination.offset = offset + 20;
            state.pagination.hasNext = data.has_next || false;

            if (state.parentPrompts.length === 0) {
                showEmptyState();
            } else {
                showParentsContainer();
                renderParentPrompts();
                updateLoadMoreVisibility();
            }

        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') {
                return; // Stop execution, the service is handling the redirect.
            }
            console.error("Error fetching parent prompts:", error);
            showError("Could not load your designs. Please try again later.");
        } finally {
            state.pagination.loading = false;
            updateLoadMoreButton(false);
        }
    }

    async function fetchEditGroups(threadId) {
        if (state.editGroups[threadId]) {
            return state.editGroups[threadId]; // Return cached data
        }

        try {
            const data = await authService.fetchAuthenticated(`/users/history/edit-groups?thread_id=${threadId}`);
            state.editGroups[threadId] = data.edit_groups || [];
            return state.editGroups[threadId];

        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') {
                // We re-throw the error here so the calling function knows to stop.
                throw error;
            }
            console.error("Error fetching edit groups:", error);
            throw error;
        }
    }

    // --- UI RENDERING ---
    function renderParentPrompts() {
        elements.parentsContainer.innerHTML = '';

        state.parentPrompts.forEach(parent => {
            const card = createParentPromptCard(parent);
            elements.parentsContainer.appendChild(card);
        });
    }

    function createParentPromptCard(parent) {
        const card = document.createElement('div');
        card.className = 'parent-prompt-card';
        card.dataset.threadId = parent.design_thread_id;

        const isExpanded = state.expandedThreads.has(parent.design_thread_id);
        if (isExpanded) {
            card.classList.add('expanded');
        }

        /* 
        Commented this for now to avoid backend complexity
                        <div class="meta-item">
                            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>${parent.total_designs_count} design${parent.total_designs_count !== 1 ? 's' : ''}</span>
                        </div>
        */
        card.innerHTML = `
            <div class="parent-header">
                <img src="${parent.thumbnail_url || '/app/history/placeholder-thumbnail.svg'}" 
                     alt="Design thumbnail" 
                     class="parent-thumbnail"
                     onerror="this.style.background='linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';  this.removeAttribute('src');">
                <div class="parent-info">
                    <div class="parent-prompt">${escapeHtml(parent.original_prompt)}</div>
                    <div class="parent-meta">
                        <div class="meta-item">
                            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                            </svg>
                            <span>${parent.edit_groups_count} variation${parent.edit_groups_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="meta-item">
                            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path>
                            </svg>
                            <span>${formatDate(parent.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="parent-actions">
                <button class="expand-arrow-btn ${isExpanded ? 'expanded' : ''}" 
                        onclick="handleParentExpand('${parent.design_thread_id}')">
                    <svg class="expand-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                </button>
            </div>
            ${isExpanded ? '<div class="edit-groups-expanded" id="expanded-' + parent.design_thread_id + '"></div>' : ''}
        `;

        return card;
    }

    async function handleParentExpand(threadId) {
        if (state.isMobile) {
            await openMobileModal(threadId);
        } else {
            await toggleDesktopExpansion(threadId);
        }
    }
async function toggleDesktopExpansion(threadId) {
    const card = document.querySelector(`[data-thread-id="${threadId}"]`);
    const expandBtn = card.querySelector('.expand-arrow-btn');
    const expandedContainer = card.querySelector(`#expanded-${threadId}`);

    if (state.expandedThreads.has(threadId)) {
        // Collapse this one
        state.expandedThreads.delete(threadId);
        expandBtn.classList.remove('expanded');
        card.classList.remove('expanded');
        if (expandedContainer) {
            expandedContainer.remove();
        }
    } else {
        // CLOSE ALL OTHER EXPANDED THREADS FIRST
        state.expandedThreads.forEach(otherThreadId => {
            if (otherThreadId !== threadId) {
                const otherCard = document.querySelector(`[data-thread-id="${otherThreadId}"]`);
                if (otherCard) {
                    const otherBtn = otherCard.querySelector('.expand-arrow-btn');
                    const otherContainer = otherCard.querySelector(`#expanded-${otherThreadId}`);
                    
                    otherBtn.classList.remove('expanded');
                    otherCard.classList.remove('expanded');
                    if (otherContainer) {
                        otherContainer.remove();
                    }
                }
            }
        });
        
        // Clear the expanded threads set and add only this one
        state.expandedThreads.clear();
        state.expandedThreads.add(threadId);
        
        // Expand this one
        expandBtn.classList.add('expanded');
        card.classList.add('expanded');
        
        // Create expanded container if it doesn't exist
        let container = expandedContainer;
        if (!container) {
            container = document.createElement('div');
            container.className = 'edit-groups-expanded';
            container.id = `expanded-${threadId}`;
            card.appendChild(container);
        }

        // Show loading state
        container.innerHTML = `
            <div class="edit-groups-header">
                <div class="edit-groups-title">Loading variations...</div>
            </div>
            <div style="text-align: center; padding: 2rem;">
                <div class="mini-spinner"></div>
            </div>
        `;

        try {
            const editGroups = await fetchEditGroups(threadId);
            renderEditGroups(editGroups, container);
        } catch (error) {
            expandBtn.classList.remove('expanded');
            card.classList.remove('expanded');
            state.expandedThreads.delete(threadId);
            container.remove();
            showError("Failed to load variations. Please try again.");
        }
    }
}

    async function openMobileModal(threadId) {
        const parent = state.parentPrompts.find(p => p.design_thread_id === threadId);
        if (!parent) return;

        state.currentThreadId = threadId;
        elements.modalTitle.textContent = `${parent.edit_groups_count} Design Variations`;

        // Show modal with loading state
        elements.editGroupsContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading variations...</p>
            </div>
        `;
        elements.editGroupsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        try {
            const editGroups = await fetchEditGroups(threadId);
            renderEditGroups(editGroups, elements.editGroupsContainer);
        } catch (error) {
            elements.editGroupsContainer.innerHTML = `
                <div class="error-state">
                    <p>Failed to load variations. Please try again.</p>
                    <button onclick="closeModal()" class="group-action-btn edit-group-btn">Close</button>
                </div>
            `;
        }
    }

    function renderEditGroups(editGroups, container) {
        container.innerHTML = '';

        // Add header for desktop view
        if (!state.isMobile) {
            const header = document.createElement('div');
            header.className = 'edit-groups-header';
            header.innerHTML = `
                <div class="edit-groups-title">Design Variations</div>
            `;
            container.appendChild(header);
        }

        const groupsGrid = document.createElement('div');
        groupsGrid.className = 'edit-groups-grid';

        editGroups.forEach(group => {
            const groupCard = createEditGroupCard(group);
            groupsGrid.appendChild(groupCard);
        });

        container.appendChild(groupsGrid);
    }

    function createEditGroupCard(group) {
        const card = document.createElement('div');
        card.className = 'edit-group-card';

        card.innerHTML = `
            <div class="edit-group-header">
                <div class="edit-group-prompt">${escapeHtml(group.prompt)}</div>
                <div class="edit-group-meta">
                    <div class="edit-group-date">${formatDate(group.created_at)}</div>
                    <div class="prompt-type-badge ${group.prompt_type}">${group.prompt_type}</div>
                </div>
            </div>
            <div class="designs-preview">
                <div class="designs-scroll-container">
                    ${group.images_json.map(img => `
                        <div class="design-card">
                            <img src="${img.image_url}" 
                                 alt="${img.size_preset}" 
                                 class="design-thumbnail"
                                 onclick="openImagePreview('${img.image_url}')">
                            <div class="design-card-info">
                                <div class="design-size-label">${img.size_preset.replace(/_/g, ' ')}</div>
                                <div class="design-actions">
                                    <button class="design-action-btn preview-btn" 
                                            onclick="openImagePreview('${img.image_url}')"
                                            title="Preview">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                    <button class="design-action-btn download-btn" 
                                            onclick="downloadSingleImage('${img.image_url}', '${img.size_preset}')"
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
                <div class="designs-count">${group.images_json.length} design${group.images_json.length !== 1 ? 's' : ''}</div>
                <div class="group-actions">
                    <button class="group-action-btn edit-group-btn" 
                            onclick="editEditGroup('${group.generation_id}')">
                        Edit Group ${!subscriptionService.isPro() ? '🔒' : ''}
                    </button>
                    <button class="group-action-btn download-all-btn" 
                            onclick="downloadEditGroup('${group.generation_id}')">
                        Download All
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // --- EVENT HANDLERS ---
    async function handleLoadMore() {
        if (!state.pagination.hasNext || state.pagination.loading) return;
        await fetchParentPrompts(state.pagination.offset);
    }

    function closeModal() {
        elements.editGroupsModal.style.display = 'none';
        document.body.style.overflow = '';
        state.currentThreadId = null;
    }

    // --- NAVIGATION FUNCTIONS ---
    function editEditGroup(generationId) {
         if (!subscriptionService.isPro()) {
            showUpgradeModal('Loading past designs for editing is a Pro feature. Upgrade to regain full access to your creative history!');
            return; 
        }
        window.location.href = `/app/?edit=${generationId}`;
    }

    async function downloadEditGroup(generationId) {
        const threadId = state.currentThreadId || findThreadIdByGenerationId(generationId);
        if (!threadId) return;

        const editGroups = state.editGroups[threadId];
        if (!editGroups) return;

        const group = editGroups.find(g => g.generation_id === generationId);
        if (!group) return;

        const button = event.target.closest('.download-all-btn');
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="mini-spinner"></div>
                Downloading...
            `;
        }

        try {
            for (let i = 0; i < group.images_json.length; i++) {
                const image = group.images_json[i];
                const filename = `layoutcraft_${image.size_preset}_${Date.now()}_${i + 1}.png`;
                await downloadImageFile(image.image_url, filename);

                if (i < group.images_json.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        } catch (error) {
            console.error('Download failed:', error);
            showError("Download failed. Please try again.");
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    Download All
                `;
            }
        }
    }

    function openImagePreview(imageUrl) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.9); display: flex; align-items: center; 
            justify-content: center; z-index: 2000; cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px;';

        modal.appendChild(img);
        modal.addEventListener('click', () => document.body.removeChild(modal));
        document.body.appendChild(modal);
    }

    async function downloadSingleImage(imageUrl, sizePreset) {
        const button = event.target.closest('.download-btn');
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="mini-spinner"></div>
            `;
        }

        try {
            const filename = `layoutcraft_${sizePreset}_${Date.now()}.png`;
            await downloadImageFile(imageUrl, filename);
        } catch (error) {
            console.error('Download failed:', error);
            showError("Download failed. Please try again.");
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                `;
            }
        }
    }

    async function downloadImageFile(imageUrl, filename) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Could not fetch image');

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    // --- UTILITY FUNCTIONS ---
    function findThreadIdByGenerationId(generationId) {
        for (const [threadId, editGroups] of Object.entries(state.editGroups)) {
            if (editGroups.some(group => group.generation_id === generationId)) {
                return threadId;
            }
        }
        return null;
    }

    function updateLoadMoreButton(loading) {
        if (!elements.loadMoreBtn) return;

        elements.loadMoreBtn.disabled = loading;
        elements.loadMoreText.style.display = loading ? 'none' : 'inline';
        elements.loadMoreLoading.style.display = loading ? 'flex' : 'none';
    }

    function updateLoadMoreVisibility() {
        if (elements.loadMoreContainer) {
            elements.loadMoreContainer.style.display = state.pagination.hasNext ? 'block' : 'none';
        }
    }

    function showLoadingState() {
        elements.loadingState.style.display = 'block';
        elements.emptyState.style.display = 'none';
        elements.parentsContainer.style.display = 'none';
        elements.loadMoreContainer.style.display = 'none';
    }

    function showEmptyState() {
        elements.loadingState.style.display = 'none';
        elements.emptyState.style.display = 'block';
        elements.parentsContainer.style.display = 'none';
        elements.loadMoreContainer.style.display = 'none';
    }

    function showParentsContainer() {
        elements.loadingState.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.parentsContainer.style.display = 'block';
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #fee2e2; 
            color: #dc2626; padding: 1rem; border-radius: 8px; z-index: 1000;
            border: 1px solid #fecaca; max-width: 300px;
        `;

        document.body.appendChild(errorDiv);
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 5000);
    }

    function formatDate(dateString) {
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    // --- GLOBAL FUNCTIONS (for onclick handlers) ---
    window.handleParentExpand = handleParentExpand;
    window.editEditGroup = editEditGroup;
    window.downloadEditGroup = downloadEditGroup;
    window.openImagePreview = openImagePreview;
    window.closeModal = closeModal;
    window.downloadSingleImage = downloadSingleImage;


    function showUpgradeModal(message) {
        const existingModal = document.getElementById('upgrade-modal');
        if (existingModal) existingModal.remove();

        const modalHTML = `
        <div class="auth-modal-overlay active" id="upgrade-modal" style="z-index: 10001; /* Higher than history modal */">
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
        modal.querySelector('.auth-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    init();
});