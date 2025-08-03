// LayoutCraft Blog Magazine Layout - Mobile-First JavaScript
import { 
    blogPosts, 
    getFeaturedPost,
    getPostUrl,
    POSTS_PER_PAGE 
} from './blog-config.js';

class BlogMagazine {
    constructor() {
        this.allPosts = blogPosts.filter(post => !post.isFeatured);
        this.visiblePosts = POSTS_PER_PAGE;
        
        this.initializeElements();
        this.render();
        this.bindEvents();
    }
    
    initializeElements() {
        this.elements = {
            featuredStory: document.getElementById('featuredStory'),
            articlesGrid: document.getElementById('articlesGrid'),
            loadMoreBtn: document.getElementById('loadMoreBtn')
        };
        
        const requiredElements = ['featuredStory', 'articlesGrid'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.warn('Missing required elements:', missingElements);
            return false;
        }
        
        return true;
    }
    
    bindEvents() {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }
    }
    
    render() {
        this.renderFeaturedStory();
        this.renderArticles();
        this.updateLoadMoreButton();
    }
    
    renderFeaturedStory() {
        const featuredPost = getFeaturedPost();
        
        if (!featuredPost || !this.elements.featuredStory) {
            if (this.elements.featuredStory) {
                this.elements.featuredStory.style.display = 'none';
            }
            return;
        }
        
        const featuredImage = this.elements.featuredStory.querySelector('.featured-image');
        const featuredTitle = this.elements.featuredStory.querySelector('.featured-title');
        const featuredExcerpt = this.elements.featuredStory.querySelector('.featured-excerpt');
        const metaAuthor = this.elements.featuredStory.querySelector('.meta-author');
        const metaDate = this.elements.featuredStory.querySelector('.meta-date');
        const metaReadTime = this.elements.featuredStory.querySelector('.meta-read-time');
        
        if (featuredImage) {
            featuredImage.style.backgroundImage = `url('${featuredPost.thumbnail}')`;
        }
        
        if (featuredTitle) {
            featuredTitle.textContent = featuredPost.title;
        }
        
        if (featuredExcerpt) {
            featuredExcerpt.textContent = featuredPost.excerpt;
        }
        
        if (metaAuthor) {
            metaAuthor.textContent = featuredPost.author;
        }
        
        if (metaDate) {
            metaDate.textContent = featuredPost.date;
        }
        
        if (metaReadTime) {
            metaReadTime.textContent = featuredPost.readTime;
        }
        
        // Make clickable
        this.elements.featuredStory.addEventListener('click', () => {
            window.location.href = getPostUrl(featuredPost.slug);
        });
        
        this.elements.featuredStory.style.display = 'block';
    }
    
    renderArticles() {
        if (!this.elements.articlesGrid) return;
        
        this.elements.articlesGrid.innerHTML = '';
        const postsToDisplay = this.allPosts.slice(0, this.visiblePosts);
        
        postsToDisplay.forEach(post => {
            const articleCard = this.createArticleCard(post);
            this.elements.articlesGrid.appendChild(articleCard);
        });
    }
    
    createArticleCard(post) {
        const article = document.createElement('a');
        article.className = 'article-card';
        article.href = getPostUrl(post.slug);
        article.setAttribute('aria-label', `Read article: ${post.title}`);
        
        // Get primary tags (limit to 2 for mobile)
        const primaryTags = post.tags.slice(0, 2);
        
        article.innerHTML = `
            <div class="article-image" 
                 style="background-image: url('${post.thumbnail}')"
                 aria-label="${post.title}"></div>
            <div class="article-content">
                <h3 class="article-title">${post.title}</h3>
                <p class="article-excerpt">${post.excerpt}</p>
                <div class="article-meta">
                    <span>${post.date}</span>
                    <span>${post.readTime}</span>
                </div>
                <div class="article-tags">
                    ${primaryTags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        return article;
    }
    
    loadMorePosts() {
        this.visiblePosts += POSTS_PER_PAGE;
        this.renderArticles();
        this.updateLoadMoreButton();
        
        // Smooth scroll to new content
        setTimeout(() => {
            const newlyAddedCards = this.elements.articlesGrid.children;
            if (newlyAddedCards.length > 0) {
                const lastCard = newlyAddedCards[newlyAddedCards.length - Math.min(POSTS_PER_PAGE, newlyAddedCards.length)];
                lastCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
    
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;
        
        const hasMorePosts = this.visiblePosts < this.allPosts.length;
        
        if (hasMorePosts) {
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.classList.add('show');
            
            const remainingPosts = this.allPosts.length - this.visiblePosts;
            this.elements.loadMoreBtn.innerHTML = `
                Load More Articles (${remainingPosts} remaining)
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
            `;
        } else {
            this.elements.loadMoreBtn.classList.add('hidden');
            this.elements.loadMoreBtn.classList.remove('show');
        }
    }
}

// Performance and Analytics
class PerformanceTracker {
    constructor() {
        this.trackPageLoad();
        this.trackUserEngagement();
    }
    
    trackPageLoad() {
        // Track page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData && typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                    event_category: 'Performance',
                    value: Math.round(perfData.loadEventEnd - perfData.fetchStart)
                });
            }
        });
    }
    
    trackUserEngagement() {
        let scrollDepth = 0;
        let timeOnPage = Date.now();
        
        // Track scroll depth
        const updateScrollDepth = () => {
            const currentScroll = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            scrollDepth = Math.max(scrollDepth, currentScroll);
        };
        
        window.addEventListener('scroll', updateScrollDepth);
        
        // Track engagement on page unload
        window.addEventListener('beforeunload', () => {
            const sessionTime = Math.round((Date.now() - timeOnPage) / 1000);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'engagement', {
                    event_category: 'Blog',
                    custom_parameters: {
                        session_time: sessionTime,
                        scroll_depth: scrollDepth
                    }
                });
            }
        });
        
        // Track clicks on articles
        document.addEventListener('click', (e) => {
            const articleCard = e.target.closest('.article-card, .featured-story');
            if (articleCard) {
                const title = articleCard.querySelector('.article-title, .featured-title')?.textContent;
                if (title && typeof gtag !== 'undefined') {
                    gtag('event', 'article_click', {
                        event_category: 'Blog',
                        event_label: title
                    });
                }
            }
        });
    }
}

// Intersection Observer for animations
class AnimationController {
    constructor() {
        this.setupIntersectionObserver();
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        // Observe article cards as they're added
        const observeArticles = () => {
            const articles = document.querySelectorAll('.article-card');
            articles.forEach((article, index) => {
                // Stagger initial animations
                article.style.opacity = '0';
                article.style.transform = 'translateY(20px)';
                article.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                
                observer.observe(article);
            });
        };
        
        // Initial observation
        setTimeout(observeArticles, 100);
        
        // Re-observe when new articles are loaded
        const originalRenderArticles = BlogMagazine.prototype.renderArticles;
        BlogMagazine.prototype.renderArticles = function() {
            originalRenderArticles.call(this);
            setTimeout(observeArticles, 100);
        };
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main blog functionality
    const blogMagazine = new BlogMagazine();
    
    // Initialize performance tracking
    new PerformanceTracker();
    
    // Initialize animations
    new AnimationController();
    
    // Track page view
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            event_category: 'Blog',
            event_label: 'homepage'
        });
    }
});

// Export for potential external use
export { BlogMagazine };