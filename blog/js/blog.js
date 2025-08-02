// LayoutCraft Blog Main JavaScript

import { blogPosts, blogConfig, tagConfig } from './blog-config.js';

class LayoutCraftBlog {
    constructor() {
        this.posts = blogPosts;
        this.filteredPosts = [...this.posts];
        this.currentPage = 1;
        this.postsPerPage = blogConfig.postsPerPage;
        this.searchTerm = '';
        this.activeTag = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderFeaturedPost();
        this.renderTagCloud();
        this.renderPosts();
        this.setupThemeSwitcher();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('blogSearchInput');
        const searchClear = document.getElementById('blogSearchClear');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Tag filter
        const clearTagFilter = document.getElementById('clearTagFilter');
        if (clearTagFilter) {
            clearTagFilter.addEventListener('click', () => {
                this.clearTagFilter();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }
    }

    handleSearch(term) {
        this.searchTerm = term.toLowerCase();
        this.filterPosts();
        this.updateSearchUI();
    }

    clearSearch() {
        const searchInput = document.getElementById('blogSearchInput');
        const searchClear = document.getElementById('blogSearchClear');
        
        if (searchInput) {
            searchInput.value = '';
        }
        if (searchClear) {
            searchClear.style.display = 'none';
        }
        
        this.searchTerm = '';
        this.filterPosts();
    }

    updateSearchUI() {
        const searchClear = document.getElementById('blogSearchClear');
        if (searchClear) {
            searchClear.style.display = this.searchTerm ? 'block' : 'none';
        }
    }

    handleTagFilter(tag) {
        this.activeTag = this.activeTag === tag ? null : tag;
        this.filterPosts();
        this.updateTagUI();
    }

    clearTagFilter() {
        this.activeTag = null;
        this.filterPosts();
        this.updateTagUI();
    }

    updateTagUI() {
        const clearBtn = document.getElementById('clearTagFilter');
        const tagButtons = document.querySelectorAll('.tag-button');
        
        if (clearBtn) {
            clearBtn.style.display = this.activeTag ? 'block' : 'none';
        }
        
        tagButtons.forEach(btn => {
            if (btn.textContent === this.activeTag) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    filterPosts() {
        this.filteredPosts = this.posts.filter(post => {
            const matchesSearch = !this.searchTerm || 
                post.title.toLowerCase().includes(this.searchTerm) ||
                post.excerpt.toLowerCase().includes(this.searchTerm) ||
                post.tags.some(tag => tag.toLowerCase().includes(this.searchTerm));
            
            const matchesTag = !this.activeTag || post.tags.includes(this.activeTag);
            
            return matchesSearch && matchesTag;
        });

        this.currentPage = 1;
        this.renderPosts();
        this.updateNoResultsUI();
    }

    updateNoResultsUI() {
        const noResults = document.getElementById('noBlogResults');
        const blogGrid = document.querySelector('.blog-grid');
        
        if (this.filteredPosts.length === 0) {
            if (noResults) noResults.style.display = 'block';
            if (blogGrid) blogGrid.style.display = 'none';
        } else {
            if (noResults) noResults.style.display = 'none';
            if (blogGrid) blogGrid.style.display = 'grid';
        }
    }

    renderFeaturedPost() {
        const featuredPost = this.posts.find(post => post.isFeatured);
        if (!featuredPost) return;

        const featuredSection = document.querySelector('.featured-post-section');
        if (!featuredSection) return;

        const card = featuredSection.querySelector('.featured-post-card');
        if (!card) return;

        // Update featured post content
        const title = card.querySelector('.featured-post-title');
        const excerpt = card.querySelector('.featured-post-excerpt');
        const thumbnail = card.querySelector('.featured-post-thumbnail');
        const button = card.querySelector('.featured-post-button');
        const metaSpans = card.querySelectorAll('.featured-post-meta span');

        if (title) title.textContent = featuredPost.title;
        if (excerpt) excerpt.textContent = featuredPost.excerpt;
        if (thumbnail && featuredPost.thumbnail) {
            thumbnail.style.backgroundImage = `url(${featuredPost.thumbnail})`;
        }
        if (button) {
            button.href = `./${featuredPost.slug}/`;
        }
        if (metaSpans.length >= 2) {
            metaSpans[0].textContent = featuredPost.date;
            metaSpans[1].textContent = featuredPost.readTime;
        }

        // Make the entire card clickable
        card.href = `./${featuredPost.slug}/`;
    }

    renderTagCloud() {
        const tagCloud = document.getElementById('tagCloud');
        if (!tagCloud) return;

        const allTags = [...new Set(this.posts.flatMap(post => post.tags))];
        
        tagCloud.innerHTML = allTags.map(tag => `
            <button class="tag-button" onclick="blog.handleTagFilter('${tag}')">
                ${tag}
            </button>
        `).join('');
    }

    renderPosts() {
        const blogGrid = document.querySelector('.blog-grid');
        if (!blogGrid) return;

        const startIndex = 0;
        const endIndex = this.currentPage * this.postsPerPage;
        const postsToShow = this.filteredPosts
            .filter(post => !post.isFeatured)
            .slice(startIndex, endIndex);

        blogGrid.innerHTML = postsToShow.map(post => this.createPostCard(post)).join('');
        this.updateLoadMoreButton();
    }

    createPostCard(post) {
        const tagsHtml = post.tags.map(tag => `
            <span class="tag-badge">${tag}</span>
        `).join('');

        return `
            <a href="./${post.slug}/" class="post-card">
                <div class="post-card-thumbnail" style="background-image: url('${post.thumbnail}');">
                    ${post.thumbnail ? '' : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">No Image</div>'}
                </div>
                <div class="post-card-content">
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-excerpt">${post.excerpt}</p>
                    <div class="post-card-meta">
                        <span>${post.date}</span>
                        <span>${post.readTime}</span>
                    </div>
                    <div class="post-card-tags">
                        ${tagsHtml}
                    </div>
                </div>
            </a>
        `;
    }

    loadMorePosts() {
        this.currentPage++;
        this.renderPosts();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadMoreContainer = document.querySelector('.load-more-container');
        
        if (!loadMoreBtn || !loadMoreContainer) return;

        const totalPosts = this.filteredPosts.filter(post => !post.isFeatured).length;
        const shownPosts = this.currentPage * this.postsPerPage;
        
        if (shownPosts >= totalPosts) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }

    setupThemeSwitcher() {
        let currentTheme = 'light';
        
        function loadTheme() {
            try {
                const saved = localStorage.getItem('layoutcraft-theme');
                if (saved === 'dark' || saved === 'light') {
                    currentTheme = saved;
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    currentTheme = 'dark';
                }
                document.documentElement.setAttribute('data-theme', currentTheme);
            } catch (e) {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }
        
        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            try {
                localStorage.setItem('layoutcraft-theme', currentTheme);
            } catch (e) {}
            updateButton();
        }
        
        function updateButton() {
            const btn = document.getElementById('themeSwitcher');
            if (btn) {
                const icon = btn.querySelector('i');
                const isDark = currentTheme === 'dark';
                if (icon) {
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
                btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
                btn.setAttribute('aria-label', btn.title);
            }
        }
        
        // Load theme immediately
        loadTheme();
        
        // Setup when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            updateButton();
            const btn = document.getElementById('themeSwitcher');
            if (btn) {
                btn.addEventListener('click', toggleTheme);
            }
        });
    }
}

// Initialize the blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blog = new LayoutCraftBlog();
});

export default LayoutCraftBlog;