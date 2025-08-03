// LayoutCraft Blog Post JavaScript - Enhanced Reading Experience
import { 
    getRelatedPosts, 
    getNextPost, 
    getPreviousPost,
    getPostUrl,
    RELATED_POSTS_LIMIT 
} from './blog-config.js';

class BlogPost {
    constructor() {
        this.currentSlug = this.getCurrentSlug();
        this.scrollProgress = 0;
        this.tocLinks = [];
        
        this.initializeElements();
        this.bindEvents();
        this.generateTOC();
        this.renderRelatedPosts();
        this.renderNavigation();
        this.updateScrollProgress();
    }
    
    initializeElements() {
        this.elements = {
            progressBar: document.querySelector('.scroll-progress-bar'),
            tocContainer: document.getElementById('tocContainer'),
            tocList: document.getElementById('tocList'),
            articleContent: document.getElementById('articleContent'),
            relatedPostsGrid: document.getElementById('relatedPostsGrid'),
            prevPost: document.getElementById('prevPost'),
            nextPost: document.getElementById('nextPost')
        };
    }
    
    bindEvents() {
        // Scroll progress tracking
        window.addEventListener('scroll', () => {
            this.updateScrollProgress();
            this.updateActiveTOCLink();
        });
        
        // Smooth scroll for TOC links
        if (this.elements.tocList) {
            this.elements.tocList.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    e.preventDefault();
                    const targetId = e.target.getAttribute('href').substring(1);
                    this.scrollToHeading(targetId);
                }
            });
        }
        
        // Handle code block copy functionality
        this.addCodeCopyButtons();
        
        // Track reading time
        this.trackReadingTime();
    }
    
    getCurrentSlug() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        
        // Assumes URL structure: /blog/post-slug/
        if (segments.length >= 2 && segments[0] === 'blog') {
            return segments[1];
        }
        
        // Fallback for different URL structures
        return segments[segments.length - 1] || 'unknown';
    }
    
    generateTOC() {
        if (!this.elements.articleContent || !this.elements.tocList) return;
        
        const headings = this.elements.articleContent.querySelectorAll('h2, h3');
        
        if (headings.length === 0) {
            // Hide TOC if no headings
            if (this.elements.tocContainer) {
                this.elements.tocContainer.style.display = 'none';
            }
            return;
        }
        
        this.tocLinks = [];
        let tocHTML = '';
        
        headings.forEach((heading, index) => {
            // Generate ID if not present
            if (!heading.id) {
                heading.id = this.generateHeadingId(heading.textContent, index);
            }
            
            const level = heading.tagName.toLowerCase();
            const linkClass = `toc-link ${level}`;
            
            tocHTML += `
                <li>
                    <a href="#${heading.id}" class="${linkClass}">
                        ${heading.textContent}
                    </a>
                </li>
            `;
            
            this.tocLinks.push({
                id: heading.id,
                element: heading,
                link: null // Will be set after DOM update
            });
        });
        
        this.elements.tocList.innerHTML = tocHTML;
        
        // Update link references
        this.tocLinks.forEach((item, index) => {
            item.link = this.elements.tocList.querySelectorAll('a')[index];
        });
    }
    
    generateHeadingId(text, index) {
        // Create URL-friendly ID from heading text
        const baseId = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        
        return baseId || `heading-${index}`;
    }
    
    updateScrollProgress() {
        if (!this.elements.progressBar) return;
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        
        this.scrollProgress = Math.min(100, Math.max(0, progress));
        this.elements.progressBar.style.transform = `scaleX(${this.scrollProgress / 100})`;
    }
    
    updateActiveTOCLink() {
        if (this.tocLinks.length === 0) return;
        
        const scrollTop = window.pageYOffset + 100; // Offset for header
        let activeIndex = -1;
        
        // Find the current active heading
        for (let i = 0; i < this.tocLinks.length; i++) {
            const heading = this.tocLinks[i].element;
            if (heading.offsetTop <= scrollTop) {
                activeIndex = i;
            } else {
                break;
            }
        }
        
        // Update active states
        this.tocLinks.forEach((item, index) => {
            if (item.link) {
                item.link.classList.toggle('active', index === activeIndex);
            }
        });
    }
    
    scrollToHeading(headingId) {
        const heading = document.getElementById(headingId);
        if (!heading) return;
        
        const headerHeight = 80; // Account for sticky header
        const targetPosition = heading.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Track TOC usage
        this.trackInteraction('toc_click', headingId);
    }
    
    renderRelatedPosts() {
        if (!this.elements.relatedPostsGrid) return;
        
        const relatedPosts = getRelatedPosts(this.currentSlug, RELATED_POSTS_LIMIT);
        
        if (relatedPosts.length === 0) {
            const section = this.elements.relatedPostsGrid.closest('.related-posts-section');
            if (section) section.style.display = 'none';
            return;
        }
        
        this.elements.relatedPostsGrid.innerHTML = relatedPosts.map(post => `
            <a href="${getPostUrl(post.slug)}" class="post-card">
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
            </a>
        `).join('');
    }
    
    renderNavigation() {
        const nextPost = getNextPost(this.currentSlug);
        const prevPost = getPreviousPost(this.currentSlug);
        
        // Next post
        if (nextPost && this.elements.nextPost) {
            this.elements.nextPost.href = getPostUrl(nextPost.slug);
            this.elements.nextPost.querySelector('.nav-post-title').textContent = nextPost.title;
            this.elements.nextPost.classList.remove('hidden');
        }
        
        // Previous post
        if (prevPost && this.elements.prevPost) {
            this.elements.prevPost.href = getPostUrl(prevPost.slug);
            this.elements.prevPost.querySelector('.nav-post-title').textContent = prevPost.title;
            this.elements.prevPost.classList.remove('hidden');
        }
    }
    
    addCodeCopyButtons() {
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach((block, index) => {
            const pre = block.parentElement;
            if (!pre || pre.querySelector('.code-copy-btn')) return;
            
            const copyButton = document.createElement('button');
            copyButton.className = 'code-copy-btn';
            copyButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy
            `;
            
            copyButton.style.cssText = `
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                padding: 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            
            pre.style.position = 'relative';
            pre.appendChild(copyButton);
            
            // Show/hide on hover
            pre.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });
            
            pre.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0';
            });
            
            // Copy functionality
            copyButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(block.textContent);
                    
                    // Visual feedback
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = `
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Copied!
                    `;
                    
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                    }, 2000);
                    
                    this.trackInteraction('code_copy', `block-${index}`);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                }
            });
        });
    }
    
    trackReadingTime() {
        let startTime = Date.now();
        let maxScroll = 0;
        
        const trackProgress = () => {
            const currentScroll = Math.max(maxScroll, this.scrollProgress);
            maxScroll = currentScroll;
            
            // Track reading milestones
            if (currentScroll >= 25 && !this.tracked25) {
                this.trackInteraction('reading_progress', '25_percent');
                this.tracked25 = true;
            }
            if (currentScroll >= 50 && !this.tracked50) {
                this.trackInteraction('reading_progress', '50_percent');
                this.tracked50 = true;
            }
            if (currentScroll >= 75 && !this.tracked75) {
                this.trackInteraction('reading_progress', '75_percent');
                this.tracked75 = true;
            }
            if (currentScroll >= 90 && !this.tracked90) {
                this.trackInteraction('reading_progress', '90_percent');
                this.tracked90 = true;
            }
        };
        
        window.addEventListener('scroll', trackProgress);
        
        // Track time spent on page before leaving
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            this.trackInteraction('time_on_page', timeSpent.toString());
        });
    }
    
    trackInteraction(action, label = '') {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'Blog Post',
                event_label: label,
                custom_map: {
                    'post_slug': this.currentSlug
                }
            });
        }
    }
}

// Utility functions
const utils = {
    // Format code blocks for better readability
    formatCodeBlocks() {
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            // Add line numbers if requested
            if (block.dataset.lineNumbers === 'true') {
                const lines = block.textContent.split('\n');
                const numberedLines = lines.map((line, index) => 
                    `<span class="line-number">${index + 1}</span>${line}`
                ).join('\n');
                block.innerHTML = numberedLines;
            }
        });
    },
    
    // Enhance images with lazy loading and zoom
    enhanceImages() {
        const images = document.querySelectorAll('.blog-post-content img');
        images.forEach(img => {
            // Add loading="lazy" if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Add click to zoom functionality
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                utils.openImageModal(img);
            });
        });
    },
    
    // Simple image modal for zooming
    openImageModal(img) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: zoom-out;
        `;
        
        const modalImg = document.createElement('img');
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;
        
        modal.appendChild(modalImg);
        document.body.appendChild(modal);
        
        // Close on click or ESC
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modal.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        }, { once: true });
    }
};

// Initialize blog post functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const blogPost = new BlogPost();
    
    // Apply utility enhancements
    utils.formatCodeBlocks();
    utils.enhanceImages();
    
    // Track page view
    blogPost.trackInteraction('page_view', blogPost.currentSlug);
    
    // Add global click tracking for related posts
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href.includes('/blog/') && 
            link.closest('.related-posts-grid')) {
            const postSlug = link.href.split('/blog/')[1]?.replace('/', '');
            if (postSlug) {
                blogPost.trackInteraction('related_post_click', postSlug);
            }
        }
    });
});

// Export for potential external use
export { BlogPost, utils };