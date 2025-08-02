# LayoutCraft Blog Creation Guide

This guide provides comprehensive instructions for creating new blog posts on the LayoutCraft website. Follow these steps to ensure consistency, SEO optimization, and proper functionality.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Directory Structure](#directory-structure)
3. [Creating a New Blog Post](#creating-a-new-blog-post)
4. [Content Guidelines](#content-guidelines)
5. [SEO Best Practices](#seo-best-practices)
6. [Image Guidelines](#image-guidelines)
7. [Testing Your Post](#testing-your-post)

## Quick Start

1. Create a new directory: `/blog/your-post-slug/`
2. Copy the template from `/blog/welcome-to-layoutcraft-blog/index.html`
3. Update metadata, content, and configuration
4. Add your post to `blog-config.js`
5. Test locally before deployment

## Directory Structure

```
layoutcraft-frontend/
├── blog/
│   ├── css/
│   │   └── blog.css
│   ├── js/
│   │   ├── blog.js
│   │   ├── blog-config.js
│   │   └── blog-post.js
│   ├── assets/
│   │   └── images/
│   ├── your-post-slug/
│   │   └── index.html
│   └── index.html (blog homepage)
└── shared/
    ├── css/
    │   ├── variables.css
    │   ├── base.css
    │   └── layout.css
    └── js/
```

## Creating a New Blog Post

### Step 1: Create Directory Structure

Create a new directory inside `/blog/` using a URL-friendly slug:

```bash
mkdir blog/your-amazing-post-title
```

**Slug Guidelines:**
- Use lowercase letters only
- Replace spaces with hyphens
- Remove special characters
- Keep it concise but descriptive
- Example: "Building Modern CSS Layouts" → `building-modern-css-layouts`

### Step 2: Copy Template

Copy the template from the welcome post:

```bash
cp blog/welcome-to-layoutcraft-blog/index.html blog/your-post-slug/index.html
```

### Step 3: Update HTML Metadata

Update the following sections in your new `index.html`:

#### Primary Meta Tags
```html
<title>Your Post Title – LayoutCraft Blog</title>
<meta name="title" content="Your Post Title">
<meta name="description" content="Compelling description under 160 characters">
<meta name="keywords" content="relevant, keywords, separated, by, commas">
```

#### URLs and Paths
```html
<link rel="canonical" href="https://layoutcraft.tech/blog/your-post-slug/">
<meta property="og:url" content="https://layoutcraft.tech/blog/your-post-slug/">
<meta property="twitter:url" content="https://layoutcraft.tech/blog/your-post-slug/">
```

#### Images
```html
<meta property="og:image" content="https://layoutcraft.tech/blog/assets/images/your-post-cover.png">
<meta property="twitter:image" content="https://layoutcraft.tech/blog/assets/images/your-post-cover.png">
```

#### Schema.org Markup
Update the JSON-LD structured data:
```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Your Post Title",
    "description": "Your post description",
    "image": "https://layoutcraft.tech/blog/assets/images/your-post-cover.png",
    "datePublished": "2025-08-02",
    "dateModified": "2025-08-02"
}
</script>
```

### Step 4: Update Post Header

```html
<header class="blog-post-header">
    <h1 class="blog-post-title">Your Amazing Post Title</h1>
    <div class="blog-post-meta">
        <span>By LayoutCraft Team</span>
        <span><i class="fas fa-calendar-alt"></i> August 2, 2025</span>
        <span><i class="fas fa-clock"></i> 8 min read</span>
    </div>
    <div class="blog-post-tags">
        <span class="tag-badge">CSS</span>
        <span class="tag-badge">Layout</span>
        <span class="tag-badge">Modern</span>
    </div>
</header>
```

### Step 5: Add Your Content

Replace the content within `<div class="blog-post-content" id="articleContent">`:

#### Content Structure Guidelines

**Headings:**
- Use `<h2>` for main sections
- Use `<h3>` for sub-sections
- Always include `id` attributes for table of contents
- Example: `<h2 id="introduction">Introduction</h2>`

**Text Formatting:**
- `<strong>` for bold text
- `<em>` for italic text
- `<code>` for inline code
- `<a href="#">` for links

**Lists:**
```html
<ul>
    <li>Unordered list item</li>
    <li>Another item with <code>inline code</code></li>
</ul>

<ol>
    <li>Ordered list item</li>
    <li>Sequential item</li>
</ol>
```

**Code Blocks:**
```html
<pre><code class="language-css">
.modern-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
}
</code></pre>
```

**Blockquotes:**
```html
<blockquote>
    "Design is not just what it looks like and feels like. Design is how it works."
    <br>- Steve Jobs
</blockquote>
```

**Images:**
```html
<figure>
    <img src="../assets/images/your-image.png" alt="Descriptive alt text" style="width:100%; border-radius: 8px;">
    <figcaption>Figure 1: Description of the image content</figcaption>
</figure>
```

### Step 6: Update Blog Configuration

Add your post to `/blog/js/blog-config.js`:

```javascript
export const blogPosts = [
    {
        slug: 'your-post-slug',
        title: 'Your Amazing Post Title',
        excerpt: 'Compelling excerpt that summarizes the post in 1-2 sentences, under 160 characters for optimal SEO.',
        thumbnail: './assets/images/blog-cover-your-post.png',
        date: 'August 2, 2025',
        readTime: '8 min read',
        tags: ['CSS', 'Layout', 'Modern', 'Design'],
        isFeatured: false // Set to true if this should be the featured post
    },
    // ... existing posts
];
```

## Content Guidelines

### Writing Style
- **Clear and Concise**: Use simple, direct language
- **Actionable**: Provide practical insights and examples
- **Engaging**: Use examples, analogies, and real-world scenarios
- **Technical Accuracy**: Ensure all code examples work
- **Inclusive**: Use inclusive language and consider accessibility

### Code Examples
- Test all code examples before publishing
- Use syntax highlighting with appropriate language classes
- Provide context and explanation for code snippets
- Include both HTML and CSS when showing layouts

### Length Guidelines
- **Short Posts**: 500-1000 words (3-5 min read)
- **Medium Posts**: 1000-2000 words (5-10 min read)
- **Long Posts**: 2000+ words (10+ min read)

## SEO Best Practices

### Meta Descriptions
- Keep under 160 characters
- Include target keywords naturally
- Make it compelling and clickable
- Accurately reflect the content

### Headings
- Use semantic heading structure (H1 → H2 → H3)
- Include keywords in headings naturally
- Make headings descriptive and scannable

### Internal Linking
- Link to relevant other blog posts
- Link to main LayoutCraft pages when appropriate
- Use descriptive anchor text

### Keywords
- Research relevant keywords
- Use them naturally in content
- Include in title, headings, and meta description
- Don't keyword stuff

## Image Guidelines

### File Naming
- Use descriptive, SEO-friendly names
- Format: `blog-cover-post-slug.png` or `post-slug-figure-1.png`
- Keep names lowercase with hyphens

### Image Sizes
- **Blog Cover Images**: 1200x630px (Open Graph standard)
- **In-content Images**: Max width 800px
- **Thumbnails**: 400x220px for consistency

### Optimization
- Use WebP format when possible, with PNG/JPG fallbacks
- Optimize file sizes (aim for under 500KB for cover images)
- Always include descriptive alt text
- Use lazy loading for performance

### Storage
- Place all blog images in `/blog/assets/images/`
- Use relative paths: `../assets/images/your-image.png`

## Testing Your Post

### Local Testing
1. Open your post in a browser
2. Check all links work
3. Verify images load correctly
4. Test responsive design on mobile
5. Validate HTML structure

### Content Review
- [ ] Spell check and grammar check
- [ ] Verify all code examples work
- [ ] Check heading structure and IDs
- [ ] Ensure meta descriptions are under 160 characters
- [ ] Verify image alt text is descriptive

### Technical Validation
- [ ] HTML validates without errors
- [ ] All relative paths are correct
- [ ] Open Graph images display correctly
- [ ] Schema.org markup is valid
- [ ] Page loads quickly

### SEO Check
- [ ] Title is under 60 characters
- [ ] Meta description is compelling and under 160 characters
- [ ] Headings use proper hierarchy
- [ ] Images have alt text
- [ ] Internal links are relevant

## Deployment Checklist

Before publishing your post:

1. **Content Complete**: All sections written and reviewed
2. **Images Added**: All images uploaded and optimized
3. **Config Updated**: Post added to `blog-config.js`
4. **SEO Optimized**: Meta tags, descriptions, and schema markup updated
5. **Testing Passed**: Local testing completed successfully
6. **Cross-browser Compatible**: Tested in multiple browsers
7. **Mobile Responsive**: Verified on mobile devices

## Advanced Features

### Table of Contents
The table of contents is automatically generated from H2 and H3 headings. Ensure all headings have unique `id` attributes.

### Scroll Progress
The scroll progress bar is automatically enabled for all posts.

### Theme Support
Posts automatically support light/dark theme switching.

### Social Sharing
Open Graph and Twitter Card metadata enable rich social sharing.

## Troubleshooting

### Common Issues

**Images not loading:**
- Check file paths are correct and relative
- Verify images exist in `/blog/assets/images/`
- Ensure file names match exactly (case-sensitive)

**Table of Contents not working:**
- Verify headings have `id` attributes
- Check for duplicate IDs
- Ensure headings are H2 or H3 only

**Styling issues:**
- Verify CSS files are linked correctly
- Check for typos in class names
- Ensure proper HTML structure

### Performance Issues

**Slow loading:**
- Optimize image file sizes
- Use WebP format when possible
- Minimize custom CSS

**JavaScript errors:**
- Check browser console for errors
- Verify all scripts are loading
- Ensure proper module imports

## Support

For questions or issues with blog creation:

1. Check this guide first
2. Review existing blog posts for examples
3. Test in a local environment
4. Check browser console for errors

Remember: Consistency is key. Follow the established patterns and guidelines to maintain a professional, cohesive blog experience.