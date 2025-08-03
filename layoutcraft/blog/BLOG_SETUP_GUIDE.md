# LayoutCraft Blog Setup Guide

This guide explains how to add new blog posts and maintain the LayoutCraft blog system.

## 🗂️ Directory Structure

```
blog/
├── index.html                    # Blog homepage
├── template-post/               # Template for new posts
│   └── index.html
├── css/
│   ├── variables.css           # CSS variables (shared colors, spacing, etc.)
│   └── blog.css               # Main blog styles (mobile-first)
├── js/
│   ├── blog-config.js         # Blog posts configuration
│   ├── blog-home.js          # Homepage functionality
│   └── blog-post.js          # Individual post functionality
└── assets/
    └── images/               # Blog post images and thumbnails
```

## 📝 Adding a New Blog Post

### Step 1: Add Post to Configuration

Edit `js/blog-config.js` and add your new post to the `blogPosts` array:

```javascript
{
    slug: 'your-post-slug',                    // Used in URL: /blog/your-post-slug/
    title: 'Your Amazing Blog Post Title',
    excerpt: 'A compelling summary of your post that appears in cards and meta descriptions.',
    thumbnail: '../blog/assets/images/your-post-image.png',
    date: 'January 20, 2025',                  // Display date
    dateISO: '2025-01-20',                     // ISO date for sorting
    readTime: '8 min read',
    author: 'Your Name',
    tags: ['AI Design', 'Tutorial', 'LayoutCraft'], // Max 4-5 tags recommended
    isFeatured: false,                         // Only one post should be featured
    keywords: 'relevant, seo, keywords, for, meta, tags'
}
```

### Step 2: Create Post Directory

```bash
mkdir /blog/your-post-slug/
```

### Step 3: Create Post HTML

1. Copy the template:
```bash
cp /blog/template-post/index.html /blog/your-post-slug/index.html
```

2. Replace all placeholders in the HTML:
   - `{{ BLOG_POST_TITLE }}` → Your post title
   - `{{ BLOG_POST_EXCERPT }}` → Your post excerpt
   - `{{ BLOG_POST_SLUG }}` → your-post-slug
   - `{{ BLOG_POST_KEYWORDS }}` → Your SEO keywords
   - `{{ BLOG_POST_AUTHOR }}` → Author name
   - `{{ BLOG_POST_DATE }}` → Display date
   - `{{ BLOG_POST_DATE_ISO }}` → ISO date (YYYY-MM-DD)
   - `{{ BLOG_POST_READ_TIME }}` → Estimated read time
   - `{{ BLOG_POST_IMAGE }}` → Thumbnail filename

### Step 4: Add Your Content

Replace the template content in the `<div class="blog-post-content">` section with your article.

#### Content Structure Guidelines:

```html
<!-- Main sections use h2 -->
<h2>Main Section Heading</h2>
<p>Your content here...</p>

<!-- Subsections use h3 -->
<h3>Subsection Heading</h3>
<p>More content...</p>

<!-- Code blocks -->
<pre><code class="language-javascript">
function example() {
    console.log("Hello LayoutCraft!");
}
</code></pre>

<!-- Important callouts -->
<blockquote>
<p>💡 <strong>Pro Tip:</strong> This is an important insight readers should remember.</p>
</blockquote>

<!-- Lists -->
<ul>
<li>First important point</li>
<li>Second important point</li>
</ul>

<!-- Images -->
<img src="../assets/images/your-image.png" alt="Descriptive alt text" />
```

### Step 5: Add Images

1. Add your thumbnail and content images to `assets/images/`
2. Use descriptive filenames: `ai-design-workflow-diagram.png`
3. Optimize images for web:
   - Thumbnails: 1200x630px (16:9 ratio)
   - Content images: Max 1200px width
   - Use WebP or PNG format
   - Compress for web (aim for <200KB per image)

### Step 6: Update Tags (if needed)

Update the tags section in your post HTML:

```html
<div class="blog-post-tags">
    <span class="tag-badge">AI Design</span>
    <span class="tag-badge">Tutorial</span>
    <span class="tag-badge">LayoutCraft</span>
</div>
```

## 🎯 Content Guidelines

### Writing Style
- **Tone**: Professional but approachable, matching LayoutCraft's brand
- **Length**: 1,500-3,000 words ideal for SEO and engagement
- **Focus**: AI design, visual content creation, productivity, design automation

### Structure Best Practices
1. **Introduction** (150-200 words)
   - Hook the reader with a problem or insight
   - Preview what they'll learn
   
2. **Main Content** (3-5 sections)
   - Use descriptive h2 headings
   - Include actionable insights
   - Add examples and visuals
   
3. **Conclusion** (100-150 words)
   - Summarize key takeaways
   - Include call-to-action (try LayoutCraft, share post, etc.)

### SEO Guidelines
- **Title**: 50-60 characters, include primary keyword
- **Excerpt**: 150-160 characters, compelling and keyword-rich
- **Headings**: Use h2/h3 hierarchy, include relevant keywords
- **Links**: Link to other blog posts and LayoutCraft features
- **Keywords**: Focus on 1 primary + 2-3 secondary keywords

## 🎨 Visual Assets Requirements

### Thumbnail Images
- **Size**: 1200x630px (exact)
- **Format**: PNG or WebP
- **Style**: Match LayoutCraft's visual brand
- **Text**: Minimal, readable at small sizes
- **Naming**: `descriptive-title.png`

### Content Images
- **Screenshots**: Annotate key areas with arrows/highlights
- **Diagrams**: Use LayoutCraft's color palette (indigo/purple gradients)
- **Examples**: Show before/after comparisons when relevant

### Brand Colors to Use
```css
Primary: #4f46e5 (indigo-600)
Secondary: #9333ea (purple-600)  
Accent: #818cf8 (indigo-400)
Gradients: from-indigo-500 to-purple-600
```

## 🚀 Publishing Checklist

Before publishing, verify:

- [ ] Post added to `blog-config.js`
- [ ] All template placeholders replaced
- [ ] Images optimized and uploaded
- [ ] Content proofread and formatted
- [ ] Links tested (internal and external)
- [ ] Meta tags complete
- [ ] Mobile-friendly (responsive images/content)
- [ ] Table of contents generates correctly (h2/h3 headings)
- [ ] Tags match existing tag categories

## 🔧 Technical Features

### Automatic Features
- **Table of Contents**: Auto-generated from h2/h3 headings
- **Related Posts**: Based on matching tags
- **Reading Progress**: Scroll progress bar
- **Code Highlighting**: Syntax highlighting with Prism.js
- **Copy Code**: Click-to-copy buttons on code blocks
- **Mobile Optimization**: Responsive design, touch-friendly
- **SEO**: Structured data, Open Graph, Twitter Cards

### Manual Features
- **Featured Post**: Set `isFeatured: true` for one post only
- **Post Order**: Sorted by `dateISO` (newest first)
- **Navigation**: Previous/next based on array order in config

## 📊 Analytics & Tracking

The blog automatically tracks:
- Page views
- Reading progress (25%, 50%, 75%, 90%)
- Time on page
- Click-through rates
- Search usage
- Tag filter usage

Events are sent to Google Analytics with the event category "Blog" or "Blog Post".

## 🛠️ Troubleshooting

### Common Issues

**1. Post not appearing on homepage**
- Check `blog-config.js` syntax (trailing commas, quotes)
- Ensure `isFeatured: false` (only one can be featured)
- Verify date format is correct

**2. Images not loading**
- Check file paths (relative to post location)
- Verify images exist in `assets/images/`
- Check image file extensions match HTML

**3. Table of Contents empty**
- Ensure you have h2 or h3 headings in content
- Check for proper HTML structure
- Verify headings have text content

**4. Styling issues**
- Check CSS syntax in custom styles
- Verify class names match blog.css
- Test on mobile devices

### Performance Tips

1. **Image Optimization**
   - Use WebP format when possible
   - Compress images before upload
   - Consider lazy loading for content images

2. **Content Loading**
   - Keep posts under 5MB total size
   - Optimize code blocks (avoid extremely long examples)
   - Use external links for large resources

3. **JavaScript**
   - Blog JS is modular and lazy-loaded
   - Avoid adding heavy external scripts
   - Test performance on mobile devices

## 📱 Mobile-First Design

The blog is built with mobile-first principles:

- **Navigation**: Collapsible mobile menu
- **Typography**: Readable font sizes on small screens
- **Images**: Responsive and touch-friendly
- **Code Blocks**: Horizontal scroll on mobile
- **Search**: Touch-optimized input fields
- **Cards**: Stack vertically on mobile

## 🔒 Security Considerations

- **Content**: No executable code in posts
- **Images**: Only upload trusted image files
- **Links**: Verify external links are safe
- **XSS**: HTML content is not dynamically executed

## 📞 Support

For questions about blog setup or troubleshooting:

1. Check this documentation first
2. Review existing blog posts for examples
3. Test changes on a local copy before deploying
4. Ensure all files are properly uploaded to the server

---

*This blog system is designed to be maintainable, performant, and SEO-friendly while maintaining LayoutCraft's visual brand and user experience standards.*