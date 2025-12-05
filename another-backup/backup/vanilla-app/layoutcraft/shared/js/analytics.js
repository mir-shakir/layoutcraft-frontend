// shared/js/analytics.js
// Google Analytics initialization
if (typeof gtag !== 'undefined') {
    gtag('config', 'G-DJ5GEKEX8H', {
        page_path: window.location.pathname
    });
}

// Track page views
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    }
});

// Function to handle scroll depth tracking on blog posts
const trackScrollDepth = () => {
    // Only run on blog post pages
    if (!window.location.pathname.includes('/blog/posts/')) {
        return;
    }

    const checkpoints = [25, 50, 75, 90];
    const trackedCheckpoints = new Set();

    const handleScroll = () => {
        const body = document.body;
        const html = document.documentElement;
        const scrollHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        const scrollPercent = Math.round(((scrollTop + windowHeight) / scrollHeight) * 100);

        checkpoints.forEach(checkpoint => {
            if (scrollPercent >= checkpoint && !trackedCheckpoints.has(checkpoint)) {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'scroll_depth', {
                        event_category: 'Blog',
                        event_label: `Scrolled ${checkpoint}%`,
                        scroll_percentage: checkpoint,
                        page_path: window.location.pathname
                    });
                }
                trackedCheckpoints.add(checkpoint);
            }
        });

        // If all checkpoints are tracked, remove the listener
        if (trackedCheckpoints.size === checkpoints.length) {
            window.removeEventListener('scroll', handleScroll);
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
};

// Add the scroll tracking on DOMContentLoaded
document.addEventListener('DOMContentLoaded', trackScrollDepth);