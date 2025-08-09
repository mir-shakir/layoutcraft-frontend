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