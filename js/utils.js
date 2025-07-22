/**
 * Utility functions for LayoutCraft
 */

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate random ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
}

// Validate image dimensions
function validateDimensions(width, height) {
    const minSize = 100;
    const maxSize = 3000;

    if (width < minSize || width > maxSize) {
        throw new Error(`Width must be between ${minSize} and ${maxSize} pixels`);
    }

    if (height < minSize || height > maxSize) {
        throw new Error(`Height must be between ${minSize} and ${maxSize} pixels`);
    }

    return true;
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Check if device is mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Get device type
function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

// Export utilities
window.utils = {
    debounce,
    throttle,
    formatFileSize,
    generateId,
    copyToClipboard,
    validateDimensions,
    sanitizeFilename,
    isMobile,
    getDeviceType
};
  