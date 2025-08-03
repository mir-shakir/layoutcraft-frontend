// LayoutCraft Blog Configuration
// Define blog posts and related functionality

export const blogPosts = [
    {
        slug: 'ai-design-revolution',
        title: 'The AI Design Revolution: Why Structure Beats Chaos',
        excerpt: 'Discover how structured AI design tools like LayoutCraft are transforming the creative process, moving beyond random art generation to predictable, professional results.',
        thumbnail: '../blog/assets/images/ai-design-revolution.png',
        date: 'January 15, 2025',
        dateISO: '2025-01-15',
        readTime: '7 min read',
        author: 'LayoutCraft Team',
        tags: ['AI Design', 'Productivity', 'Visual Content', 'LayoutCraft'],
        isFeatured: true,
        keywords: 'AI design, structured design, visual content creation, design automation'
    },
    {
        slug: 'mobile-first-design-principles',
        title: 'Mobile-First Design in the AI Era: Creating Responsive Visual Content',
        excerpt: 'Learn how to leverage AI tools to create stunning visual content that works perfectly across all devices, from mobile screens to desktop displays.',
        thumbnail: '../blog/assets/images/mobile-first-design.png',
        date: 'January 12, 2025',
        dateISO: '2025-01-12',
        readTime: '6 min read',
        author: 'Alex Chen',
        tags: ['Mobile Design', 'Responsive Design', 'AI Tools', 'User Experience'],
        isFeatured: false,
        keywords: 'mobile first design, responsive design, AI visual content, UX design'
    },
    {
        slug: 'brand-consistency-ai-generated-content',
        title: 'Maintaining Brand Consistency with AI-Generated Visual Content',
        excerpt: 'Explore strategies for ensuring your AI-generated designs maintain brand consistency while leveraging the power of automated content creation.',
        thumbnail: '../blog/assets/images/brand-consistency.png',
        date: 'January 10, 2025',
        dateISO: '2025-01-10',
        readTime: '8 min read',
        author: 'Sarah Mitchell',
        tags: ['Branding', 'AI Design', 'Marketing', 'Visual Identity'],
        isFeatured: false,
        keywords: 'brand consistency, AI design, visual identity, marketing automation'
    },
    {
        slug: 'future-of-design-automation',
        title: 'The Future of Design Automation: Trends and Predictions for 2025',
        excerpt: 'Get insights into the emerging trends in design automation and how AI-powered tools will shape the creative industry in 2025 and beyond.',
        thumbnail: '../blog/assets/images/future-design-automation.png',
        date: 'January 8, 2025',
        dateISO: '2025-01-08',
        readTime: '9 min read',
        author: 'Dr. Emily Rodriguez',
        tags: ['Future Trends', 'Design Automation', 'AI Technology', 'Industry Insights'],
        isFeatured: false,
        keywords: 'design automation, AI trends, future of design, creative technology'
    },
    {
        slug: 'social-media-content-ai-generation',
        title: 'Scaling Social Media Content Creation with AI Design Tools',
        excerpt: 'Discover how to use AI design tools to create consistent, high-quality social media content at scale while maintaining your unique brand voice.',
        thumbnail: '../blog/assets/images/social-media-ai.png',
        date: 'January 5, 2025',
        dateISO: '2025-01-05',
        readTime: '5 min read',
        author: 'Marcus Johnson',
        tags: ['Social Media', 'Content Creation', 'AI Tools', 'Marketing'],
        isFeatured: false,
        keywords: 'social media design, AI content creation, marketing automation, brand content'
    },
    {
        slug: 'optimizing-ai-prompts-better-designs',
        title: 'The Art of AI Prompting: How to Get Better Design Results',
        excerpt: 'Master the techniques for crafting effective prompts that generate professional, usable designs from AI tools like LayoutCraft.',
        thumbnail: '../blog/assets/images/ai-prompting-guide.png',
        date: 'January 3, 2025',
        dateISO: '2025-01-03',
        readTime: '10 min read',
        author: 'LayoutCraft Team',
        tags: ['AI Prompting', 'Design Tips', 'Tutorial', 'Best Practices'],
        isFeatured: false,
        keywords: 'AI prompting, design prompts, AI design tips, prompt engineering'
    }
];

// Extract unique tags from all posts
export const getAllTags = () => {
    const tagSet = new Set();
    blogPosts.forEach(post => {
        post.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
};

// Get posts by tag
export const getPostsByTag = (tag) => {
    return blogPosts.filter(post => 
        post.tags.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
    );
};

// Search posts by title, excerpt, or tags
export const searchPosts = (query) => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return blogPosts;
    
    return blogPosts.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(searchTerm);
        const excerptMatch = post.excerpt.toLowerCase().includes(searchTerm);
        const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const authorMatch = post.author.toLowerCase().includes(searchTerm);
        
        return titleMatch || excerptMatch || tagMatch || authorMatch;
    });
};

// Get featured post
export const getFeaturedPost = () => {
    return blogPosts.find(post => post.isFeatured);
};

// Get related posts (excluding current post)
export const getRelatedPosts = (currentSlug, limit = 3) => {
    const currentPost = blogPosts.find(post => post.slug === currentSlug);
    if (!currentPost) return blogPosts.slice(0, limit);
    
    // Find posts with matching tags
    const relatedPosts = blogPosts
        .filter(post => post.slug !== currentSlug)
        .map(post => {
            const matchingTags = post.tags.filter(tag => 
                currentPost.tags.includes(tag)
            ).length;
            return { ...post, matchingTags };
        })
        .sort((a, b) => {
            // Sort by matching tags first, then by date
            if (a.matchingTags !== b.matchingTags) {
                return b.matchingTags - a.matchingTags;
            }
            return new Date(b.dateISO) - new Date(a.dateISO);
        })
        .slice(0, limit);
    
    return relatedPosts;
};

// Get post by slug
export const getPostBySlug = (slug) => {
    return blogPosts.find(post => post.slug === slug);
};

// Get recent posts
export const getRecentPosts = (limit = 6) => {
    return blogPosts
        .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO))
        .slice(0, limit);
};

// Navigation helpers
export const getNextPost = (currentSlug) => {
    const currentIndex = blogPosts.findIndex(post => post.slug === currentSlug);
    if (currentIndex === -1 || currentIndex === blogPosts.length - 1) return null;
    return blogPosts[currentIndex + 1];
};

export const getPreviousPost = (currentSlug) => {
    const currentIndex = blogPosts.findIndex(post => post.slug === currentSlug);
    if (currentIndex <= 0) return null;
    return blogPosts[currentIndex - 1];
};

// Format date helper
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Generate blog post URL
export const getPostUrl = (slug) => {
    return `./${slug}/`;
};

// Constants
export const POSTS_PER_PAGE = 6;
export const RELATED_POSTS_LIMIT = 3;