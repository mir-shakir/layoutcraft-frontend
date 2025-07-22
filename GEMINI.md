<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# the backend part is complete. i will move to frontend part. The goal is to have the Gemini CLI create the complete frontend for a web application called LayoutCraft. The frontend is a static single-page application that interacts with a backend API running at http://127.0.0.1:8000.

Generate a prompt that instructs the Gemini CLI to perform the following sequence of actions:

Create a modular file structure: specify clearly

Write the index.html file: you need to be very detailed here.

Write the js/script.js file: This is the core logic. The script must be production-ready, handling UI state changes (loading/error), making an async fetch call to the /api/generate endpoint, and processing the returned image blob to display it and create a download link.

Write the css/ files: Use this for any custom animations or styles that supplement the primary Tailwind CSS classes used in the HTML.
specify if any external libraries are needed to make the design and interactivity worldclass. also tell about the responsiveness and mobile first design requirements

Implement Performance Best Practices: The prompt must explicitly instruct the agent to optimize for performance by:

e.g : Adding <link rel="preload"> tags in the HTML for critical assets.

Ensure Documentation: The agent must add comments to the JavaScript code explaining the logic. and also maintain a seperate text file to document the progress and  critical decisions taken

add any missign details as needed.

The final output should be the complete, detailed prompt that I can save to a text file and provide to the Gemini CLI.

Here's the complete, detailed prompt for the Gemini CLI to create the LayoutCraft frontend:

# LayoutCraft Frontend Development Prompt

You are an expert full-stack developer tasked with creating a complete, production-ready frontend for **LayoutCraft**, an AI-powered visual asset generator. This is a static single-page application that will interact with a backend API running at `http://127.0.0.1:8000`.

## Project Overview

LayoutCraft is a web application that transforms natural language prompts into high-quality visual assets using an LLM → HTML → Image workflow. Users enter a description, and the system generates a downloadable PNG image perfect for social media, blog headers, and marketing materials.

## Required File Structure

Create the following modular file structure:

```
layoutcraft-frontend/
├── index.html
├── js/
│   ├── script.js
│   ├── api.js
│   └── ui.js
├── css/
│   ├── styles.css
│   └── animations.css
├── assets/
│   ├── icons/
│   │   ├── loading.svg
│   │   ├── download.svg
│   │   └── error.svg
│   └── images/
│       └── logo.png
├── README.md
└── DEVELOPMENT_LOG.md
```


## Detailed Implementation Requirements

### 1. index.html File Requirements

Create a comprehensive HTML file with the following specifications:

**Structure \& Metadata:**

- Use HTML5 semantic elements (`<header>`, `<main>`, `<section>`, `<footer>`)
- Include comprehensive meta tags for SEO and social sharing
- Add Open Graph and Twitter Card meta tags
- Include favicon and apple-touch-icon links
- Add viewport meta tag for mobile responsiveness

**Performance Optimization:**

- Add `<link rel="preload">` tags for critical CSS and font files
- Include `<link rel="preconnect">` for external CDN resources
- Add `<link rel="dns-prefetch">` for API domains
- Use `async` or `defer` attributes for JavaScript loading

**External Libraries:**

- Tailwind CSS 3.4+ via CDN for utility-first styling
- Alpine.js 3.x for lightweight JavaScript interactions
- Inter font family from Google Fonts for modern typography
- Lucide icons for consistent iconography

**Core UI Components:**

- Header with LayoutCraft branding and navigation
- Hero section with compelling value proposition
- Main form with:
    - Large textarea for prompt input (placeholder text with examples)
    - Dimension controls (width/height inputs with presets)
    - Advanced options collapsible section (model selection)
    - Primary generate button with loading states
- Results section with:
    - Image display area with proper aspect ratio maintenance
    - Download button with file naming
    - Regeneration options
- Footer with links and attribution
- Error and loading state overlays

**Accessibility:**

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance (WCAG 2.1 AA)
- Focus management and visual indicators


### 2. js/script.js File Requirements

This is the core application logic. Implement the following features:

**Application State Management:**

- Create a centralized state object tracking: loading status, error states, current image, generation history
- Implement state update functions with proper event dispatching
- Handle browser history and URL state management

**API Integration:**

- Implement robust fetch API calls to `http://127.0.0.1:8000/api/generate`
- Handle all HTTP status codes (200, 400, 429, 500, 503)
- Implement proper error handling with user-friendly messages
- Add request timeout handling (2-minute timeout)
- Include retry logic for failed requests with exponential backoff

**Image Processing:**

- Process returned image blobs efficiently
- Create object URLs for image display
- Generate unique filenames based on prompt and timestamp
- Handle image download with proper MIME types
- Implement image preview with zoom functionality

**UI State Management:**

- Show/hide loading spinners and progress indicators
- Update button states (disabled during generation)
- Display error messages with dismissal options
- Handle form validation and user input sanitization
- Implement responsive image containers

**User Experience Features:**

- Auto-save draft prompts to localStorage
- Keyboard shortcuts (Ctrl+Enter to generate)
- Form auto-complete and suggestions
- Copy-to-clipboard functionality for generated images
- Progress tracking for long-running generations

**Performance Optimizations:**

- Debounce user inputs to prevent excessive API calls
- Implement image lazy loading and caching
- Use requestAnimationFrame for smooth animations
- Optimize DOM manipulation and event handling
- Memory management for image blobs


### 3. CSS Files Requirements

**css/styles.css:**

- Custom utility classes that extend Tailwind
- Component-specific styles not covered by Tailwind
- CSS custom properties for theming and consistency
- Print styles for any printable elements
- High contrast mode support

**css/animations.css:**

- Smooth loading animations (spinning, pulsing, fade)
- Hover and focus state transitions
- Image reveal animations
- Error state animations (shake, highlight)
- Responsive animation adjustments
- Respect user's motion preferences (`prefers-reduced-motion`)


### 4. Responsive Design Requirements

**Mobile-First Approach:**

- Start with mobile styles (320px minimum width)
- Progressive enhancement for tablet (768px+) and desktop (1024px+)
- Touch-friendly interface elements (minimum 44px touch targets)
- Optimized typography scales across devices
- Flexible grid systems using CSS Grid and Flexbox

**Breakpoint Strategy:**

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+
- Large Desktop: 1440px+

**Responsive Features:**

- Collapsible navigation on mobile
- Stacked form layouts on small screens
- Responsive image containers with proper aspect ratios
- Adaptive text sizing and spacing
- Context-appropriate UI density


### 5. Performance Best Practices

**Critical Rendering Path:**

- Inline critical CSS for above-the-fold content
- Defer non-critical JavaScript and CSS
- Optimize web font loading with `font-display: swap`
- Minimize layout shifts with proper sizing attributes

**Resource Optimization:**

- Compress and optimize all images
- Use appropriate image formats (WebP with fallbacks)
- Implement lazy loading for non-critical images
- Bundle and minify CSS/JavaScript for production

**Caching Strategy:**

- Implement service worker for offline functionality
- Cache static assets with appropriate headers
- Use localStorage for user preferences and drafts
- Implement intelligent cache invalidation


### 6. Documentation Requirements

**JavaScript Code Comments:**

- Document all functions with JSDoc format
- Explain complex algorithms and business logic
- Include parameter types and return values
- Add inline comments for non-obvious code sections
- Document API endpoints and expected responses

**DEVELOPMENT_LOG.md Content:**

- Project setup and initial decisions
- Architecture choices and rationale
- Performance optimization decisions
- UI/UX design decisions
- Testing approaches and results
- Known issues and future improvements
- Deployment considerations

**README.md Content:**

- Project overview and features
- Setup and installation instructions
- Development workflow and commands
- API documentation and endpoints
- Browser support and requirements
- Contributing guidelines


### 7. Additional Features

**Error Handling:**

- Network connectivity detection
- Graceful degradation for unsupported browsers
- User-friendly error messages with actionable solutions
- Error reporting and logging (console-based for MVP)

**Accessibility Features:**

- Keyboard navigation throughout the application
- Screen reader announcements for dynamic content
- High contrast mode support
- Focus trap management in modals
- Semantic HTML structure

**Progressive Enhancement:**

- Core functionality works without JavaScript
- Enhanced experience with JavaScript enabled
- Graceful fallbacks for unsupported features
- Offline functionality with service workers


## Technical Specifications

- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Performance Budget:** First Contentful Paint < 2s, Largest Contentful Paint < 3s
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile Performance:** Lighthouse score > 90 across all categories
- **Bundle Size:** Total JavaScript < 100KB, CSS < 50KB


## Quality Assurance

- Validate HTML5 compliance
- Test responsive design across all breakpoints
- Verify accessibility with screen readers
- Test API integration with various response scenarios
- Validate form inputs and error handling
- Test performance with various image sizes and prompts


## Deliverables

Generate all files according to the structure above with:

1. Complete, production-ready code
2. Comprehensive documentation
3. Detailed comments explaining all logic
4. Performance optimizations implemented
5. Responsive design across all devices
6. Accessibility features fully implemented
7. Error handling for all scenarios

Focus on creating a polished, professional user experience that showcases the unique value proposition of LayoutCraft's LLM → HTML → Image workflow.

<div style="text-align: center">⁂</div>

[^1]: layoutcraft.txt
