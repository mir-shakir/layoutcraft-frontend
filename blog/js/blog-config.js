// LayoutCraft Blog Configuration

export const blogPosts = [
    {
        slug: 'welcome-to-layoutcraft-blog',
        title: 'Welcome to the LayoutCraft Blog: Where Design Meets Development',
        excerpt: 'Introducing the LayoutCraft blog - your destination for modern web design insights, development best practices, and creative inspiration for building beautiful, functional interfaces.',
        thumbnail: './assets/images/placeholder.svg',
        date: 'August 2, 2025',
        readTime: '3 min read',
        tags: ['LayoutCraft', 'Design', 'Development', 'Welcome'],
        isFeatured: true
    }
];

// Blog configuration
export const blogConfig = {
    title: 'LayoutCraft Blog',
    description: 'Insights on modern web design, development best practices, and creative solutions for building exceptional user interfaces.',
    siteUrl: 'https://layoutcraft.tech',
    postsPerPage: 6,
    maxExcerptLength: 160,
    defaultThumbnail: './assets/images/placeholder.svg'
};

// Tag configuration
export const tagConfig = {
    // Color mapping for tags (optional)
    colors: {
        'LayoutCraft': '#2563eb',
        'Design': '#06b6d4',
        'Development': '#059669',
        'CSS': '#d97706',
        'JavaScript': '#dc2626',
        'React': '#7c3aed',
        'Performance': '#be185d',
        'UX': '#0891b2',
        'UI': '#7c2d12'
    }
};

// SEO and metadata
export const seoConfig = {
    defaultTitle: 'LayoutCraft Blog – Design & Development Insights',
    titleTemplate: '%s – LayoutCraft Blog',
    defaultDescription: 'Expert insights on modern web design, development best practices, and creative solutions for building exceptional user interfaces.',
    siteUrl: 'https://layoutcraft.tech',
    twitterHandle: '@layoutcraft',
    defaultImage: '/blog/assets/images/placeholder.svg',
    author: 'LayoutCraft Team'
};