// LayoutCraft Blog Homepage JavaScript - Simplified Version
import { 
    blogPosts, 
    getFeaturedPost,
    getPostUrl,
    POSTS_PER_PAGE 
} from './blog-config.js';

class BlogHomepage {
    constructor() {
        this.allPosts = blogPosts.filter(post => !post.isFeatured);
        this.visiblePosts = POSTS_PER_PAGE;
        
        this.initializeElements();
        this.render();
    }
    
    initializeElements() {
        this.elements = {
            blogGrid: document.querySelector('.blog-grid'),
            featuredSection: document.querySelector('.featured-post-section'),
            loadMoreBtn: document.getElementById('loadMoreBtn')
        };
        
        // Check if required elements exist
        const requiredElements = ['blogGrid', 'featuredSection'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.warn('Missing required blog elements:', missingElements);
            return false;
        }
        
        return true;
    }
    
    render() {
        this.renderFeaturedPost();
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"></path>
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
    
    renderBlogPosts() {
        if (!this.elements.blogGrid) return;
        
        this.elements.blogGrid.innerHTML = '';
        const postsToDisplay = this.allPosts.slice(0, this.visiblePosts);
        
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
                    ${post.tags.slice(0, 3).map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
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
    
    loadMorePosts() {
        this.visiblePosts += POSTS_PER_PAGE;
        this.renderBlogPosts();
        this.updateLoadMoreButton();
    }
    
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;
        
        const hasMorePosts = this.visiblePosts < this.allPosts.length;
        if (hasMorePosts) {
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.classList.add('show', 'inline-flex');
            
            const remainingPosts = this.allPosts.length - this.visiblePosts;
            this.elements.loadMoreBtn.textContent = `Load More Articles (${remainingPosts} remaining)`;
            
            // Add click handler
            this.elements.loadMoreBtn.onclick = () => this.loadMorePosts();
        } else {
            this.elements.loadMoreBtn.classList.add('hidden');
            this.elements.loadMoreBtn.classList.remove('show', 'inline-flex');
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
    });
});

// Export for potential external use
export { BlogHomepage };