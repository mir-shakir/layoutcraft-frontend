// LayoutCraft Blog Homepage JavaScript
import { 
    blogPosts, 
    getAllTags, 
    getPostsByTag, 
    searchPosts, 
    getFeaturedPost,
    getPostUrl,
    POSTS_PER_PAGE 
} from './blog-config.js';

class BlogHomepage {
    constructor() {
        this.currentFilteredPosts = blogPosts.filter(post => !post.isFeatured);
        this.visiblePosts = POSTS_PER_PAGE;
        this.currentTag = null;
        this.currentSearchQuery = '';
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }
    
    initializeElements() {
        // Required elements
        this.elements = {
            searchInput: document.getElementById('blogSearchInput'),
            searchClear: document.getElementById('blogSearchClear'),
            blogGrid: document.querySelector('.blog-grid'),
            noResults: document.getElementById('noBlogResults'),
            tagCloud: document.getElementById('tagCloud'),
            clearTagFilter: document.getElementById('clearTagFilter'),
            featuredSection: document.querySelector('.featured-post-section'),
            loadMoreBtn: document.getElementById('loadMoreBtn')
        };
        
        // Check if required elements exist
        const requiredElements = ['blogGrid', 'tagCloud', 'featuredSection'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.warn('Missing required blog elements:', missingElements);
            return false;
        }
        
        return true;
    }
    
    bindEvents() {
        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (this.elements.searchClear) {
            this.elements.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        if (this.elements.clearTagFilter) {
            this.elements.clearTagFilter.addEventListener('click', () => {
                this.clearTagFilter();
            });
        }
        
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }
    }
    
    render() {
        this.renderFeaturedPost();
        this.renderTagCloud();
        this.renderBlogPosts();
        this.updateLoadMoreButton();
    }
    
    renderFeaturedPost() {
        const featuredPost = getFeaturedPost();
        
        if (!featuredPost || !this.elements.featuredSection) {
            if (this.elements.featuredSection) {
                this.elements.featuredSection.classList.add('hidden');
                this.elements.featuredSection.classList.remove('show');
            }
            return;
        }
        
        const card = this.elements.featuredSection.querySelector('.featured-post-card');
        if (!card) return;
        
        // Update featured post content
        const thumbnail = card.querySelector('.featured-post-thumbnail');
        const title = card.querySelector('.featured-post-title');
        const excerpt = card.querySelector('.featured-post-excerpt');
        const metaDate = card.querySelector('.meta-date');
        const metaTime = card.querySelector('.meta-time');
        const button = card.querySelector('.featured-post-button');
        
        if (thumbnail) {
            thumbnail.style.backgroundImage = `url('${featuredPost.thumbnail}')`;
            thumbnail.setAttribute('aria-label', featuredPost.title);
        }
        
        if (title) title.textContent = featuredPost.title;
        if (excerpt) excerpt.textContent = featuredPost.excerpt;
        
        if (metaDate) {
            metaDate.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                ${featuredPost.date}
            `;
        }
        
        if (metaTime) {
            metaTime.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${featuredPost.readTime}
            `;
        }
        
        if (button) {
            button.href = getPostUrl(featuredPost.slug);
        }
        
        // Make the entire card clickable
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                window.location.href = getPostUrl(featuredPost.slug);
            }
        });
        
        card.style.cursor = 'pointer';
        this.elements.featuredSection.classList.remove('hidden');
        this.elements.featuredSection.classList.add('show');
    }
    
    renderTagCloud() {
        const tags = getAllTags();
        
        if (!this.elements.tagCloud) return;
        
        this.elements.tagCloud.innerHTML = tags.map(tag => `
            <button class="tag-button ${this.currentTag === tag ? 'active' : ''}" 
                    data-tag="${tag}"
                    type="button">
                ${tag}
            </button>
        `).join('');
        
        // Bind tag click events
        this.elements.tagCloud.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-button')) {
                const tag = e.target.dataset.tag;
                this.filterByTag(tag);
            }
        });
    }
    
    renderBlogPosts() {
        if (!this.elements.blogGrid) return;
        
        this.elements.blogGrid.innerHTML = '';
        const postsToDisplay = this.currentFilteredPosts.slice(0, this.visiblePosts);
        
        if (postsToDisplay.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.hideNoResults();
        
        postsToDisplay.forEach(post => {
            const postCard = this.createPostCard(post);
            this.elements.blogGrid.appendChild(postCard);
        });
    }
    
    createPostCard(post) {
        const card = document.createElement('a');
        card.className = 'post-card';
        card.href = getPostUrl(post.slug);
        card.setAttribute('aria-label', `Read article: ${post.title}`);
        
        card.innerHTML = `
            <div class="post-card-thumbnail" 
                 style="background-image: url('${post.thumbnail}')"
                 aria-label="${post.title}"></div>
            <div class="post-card-content">
                <h3 class="post-card-title">${post.title}</h3>
                <p class="post-card-excerpt">${post.excerpt}</p>
                <div class="post-card-meta">
                    <span>${post.date}</span>
                    <span>${post.readTime}</span>
                </div>
                <div class="post-card-tags">
                    ${post.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-3px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
        
        return card;
    }
    
    handleSearch(query) {
        this.currentSearchQuery = query.trim();
        
        // Show/hide clear button
        if (this.elements.searchClear) {
            if (this.currentSearchQuery) {
                this.elements.searchClear.classList.remove('hidden');
                this.elements.searchClear.classList.add('show');
            } else {
                this.elements.searchClear.classList.add('hidden');
                this.elements.searchClear.classList.remove('show');
            }
        }
        
        // Filter posts
        this.applyFilters();
    }
    
    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        if (this.elements.searchClear) {
            this.elements.searchClear.classList.add('hidden');
            this.elements.searchClear.classList.remove('show');
        }
        
        this.currentSearchQuery = '';
        this.applyFilters();
    }
    
    filterByTag(tag) {
        if (this.currentTag === tag) {
            // Toggle off if same tag clicked
            this.clearTagFilter();
            return;
        }
        
        this.currentTag = tag;
        this.applyFilters();
        this.updateTagCloud();
        this.showClearTagFilter();
    }
    
    clearTagFilter() {
        this.currentTag = null;
        this.applyFilters();
        this.updateTagCloud();
        this.hideClearTagFilter();
    }
    
    applyFilters() {
        let filteredPosts = blogPosts.filter(post => !post.isFeatured);
        
        // Apply search filter
        if (this.currentSearchQuery) {
            filteredPosts = searchPosts(this.currentSearchQuery).filter(post => !post.isFeatured);
        }
        
        // Apply tag filter
        if (this.currentTag) {
            filteredPosts = filteredPosts.filter(post => 
                post.tags.some(tag => tag.toLowerCase() === this.currentTag.toLowerCase())
            );
        }
        
        this.currentFilteredPosts = filteredPosts;
        this.visiblePosts = POSTS_PER_PAGE; // Reset visible posts count
        this.renderBlogPosts();
        this.updateLoadMoreButton();
    }
    
    updateTagCloud() {
        if (!this.elements.tagCloud) return;
        
        const tagButtons = this.elements.tagCloud.querySelectorAll('.tag-button');
        tagButtons.forEach(button => {
            const tag = button.dataset.tag;
            button.classList.toggle('active', this.currentTag === tag);
        });
    }
    
    showClearTagFilter() {
        if (this.elements.clearTagFilter) {
            this.elements.clearTagFilter.classList.remove('hidden');
            this.elements.clearTagFilter.classList.add('show', 'inline');
        }
    }
    
    hideClearTagFilter() {
        if (this.elements.clearTagFilter) {
            this.elements.clearTagFilter.classList.add('hidden');
            this.elements.clearTagFilter.classList.remove('show', 'inline');
        }
    }
    
    loadMorePosts() {
        this.visiblePosts += POSTS_PER_PAGE;
        this.renderBlogPosts();
        this.updateLoadMoreButton();
    }
    
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;
        
        const hasMorePosts = this.visiblePosts < this.currentFilteredPosts.length;
        if (hasMorePosts) {
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.classList.add('show', 'inline-flex');
        } else {
            this.elements.loadMoreBtn.classList.add('hidden');
            this.elements.loadMoreBtn.classList.remove('show', 'inline-flex');
        }
        
        // Update button text
        if (hasMorePosts) {
            const remainingPosts = this.currentFilteredPosts.length - this.visiblePosts;
            this.elements.loadMoreBtn.textContent = `Load More Articles (${remainingPosts} remaining)`;
        }
    }
    
    showNoResults() {
        if (this.elements.noResults) {
            this.elements.noResults.classList.remove('hidden');
            this.elements.noResults.classList.add('show');
        }
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.classList.add('hidden');
            this.elements.loadMoreBtn.classList.remove('show', 'inline-flex');
        }
    }
    
    hideNoResults() {
        if (this.elements.noResults) {
            this.elements.noResults.classList.add('hidden');
            this.elements.noResults.classList.remove('show');
        }
    }
}

// Analytics helper
function trackBlogInteraction(action, label = '') {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: 'Blog',
            event_label: label
        });
    }
}

// Initialize blog homepage when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const blogHomepage = new BlogHomepage();
    
    // Track page view
    trackBlogInteraction('page_view', 'blog_homepage');
    
    // Add global click tracking for blog links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href.includes('/blog/')) {
            const postSlug = link.href.split('/blog/')[1]?.replace('/', '');
            if (postSlug && postSlug !== 'index.html') {
                trackBlogInteraction('post_click', postSlug);
            }
        }
        
        // Track tag filter usage
        if (e.target.classList.contains('tag-button')) {
            trackBlogInteraction('tag_filter', e.target.dataset.tag);
        }
    });
    
    // Track search usage
    const searchInput = document.getElementById('blogSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchInput.value.trim()) {
                    trackBlogInteraction('search', searchInput.value.trim());
                }
            }, 1000); // Track after 1 second of no typing
        });
    }
});

// Export for potential external use
export { BlogHomepage };