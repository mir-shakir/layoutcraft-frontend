// LayoutCraft App - Linear.app Inspired JavaScript

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initializeScrollAnimations();
    initializeSmoothScrolling();
    initializePromptTextarea();
    initializeGenerateButton();
    initializeNavigationEffects();
});

// Scroll-triggered animations (Linear.app style)
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Enhanced prompt textarea functionality
function initializePromptTextarea() {
    const textarea = document.querySelector('.prompt-textarea');
    const generateBtn = document.querySelector('.btn-primary.btn-lg');
    
    if (!textarea || !generateBtn) return;
    
    // Auto-resize textarea
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        
        // Update button state based on content
        if (this.value.trim().length > 0) {
            generateBtn.style.opacity = '1';
            generateBtn.style.transform = 'translateY(0)';
        } else {
            generateBtn.style.opacity = '0.8';
            generateBtn.style.transform = 'translateY(2px)';
        }
    });
    
    // Add focus animations
    textarea.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateY(-2px)';
        this.parentElement.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.15)';
    });
    
    textarea.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateY(0)';
        this.parentElement.style.boxShadow = 'none';
    });
    
    // Typing animation effect
    let typingTimer;
    textarea.addEventListener('input', function() {
        clearTimeout(typingTimer);
        this.style.borderColor = 'var(--accent-blue)';
        
        typingTimer = setTimeout(() => {
            this.style.borderColor = 'var(--border-primary)';
        }, 1000);
    });
}

// Generate button interactions
function initializeGenerateButton() {
    const generateBtn = document.querySelector('.btn-primary.btn-lg');
    const textarea = document.querySelector('.prompt-textarea');
    
    if (!generateBtn || !textarea) return;
    
    generateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const prompt = textarea.value.trim();
        if (!prompt) {
            // Shake animation for empty prompt
            textarea.style.animation = 'shake 0.5s ease-in-out';
            textarea.focus();
            setTimeout(() => {
                textarea.style.animation = '';
            }, 500);
            return;
        }
        
        // Loading state
        const originalText = this.innerHTML;
        this.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
                <path d="M12 2v4l-1.5-1.5L9 6l3-3zm0 20v-4l1.5 1.5L15 18l-3 3zm10-10h-4l1.5 1.5L18 15l3-3zm-20 0h4l-1.5-1.5L6 9l-3 3z"/>
            </svg>
            Generating...
        `;
        this.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
            
            // Show success feedback
            showGenerationSuccess();
        }, 2000);
    });
}

// Navigation effects
function initializeNavigationEffects() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Header background opacity based on scroll
        if (currentScrollY > 50) {
            header.style.background = 'rgba(8, 9, 10, 0.95)';
            header.style.borderBottomColor = 'rgba(42, 42, 42, 0.8)';
        } else {
            header.style.background = 'rgba(8, 9, 10, 0.8)';
            header.style.borderBottomColor = 'var(--border-primary)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Success feedback for generation
function showGenerationSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: var(--bg-secondary);
        border: 1px solid var(--accent-green);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        color: var(--text-primary);
        font-size: var(--text-sm);
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform var(--transition-normal);
        box-shadow: var(--shadow-lg);
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-2);">
            <svg width="16" height="16" fill="var(--accent-green)" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Design generated successfully!
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add shake animation for validation
const shakeKeyframes = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
`;

// Add spin animation for loading
const spinKeyframes = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

// Inject animations
const style = document.createElement('style');
style.textContent = shakeKeyframes + spinKeyframes;
document.head.appendChild(style);

// Parallax effect for hero section (subtle)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
});

// Enhanced button hover effects
document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('btn-primary')) {
        e.target.style.transform = 'translateY(-1px) scale(1.02)';
    }
    
    if (e.target.classList.contains('feature-card')) {
        e.target.style.transform = 'translateY(-4px)';
        e.target.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
    }
    
    if (e.target.classList.contains('example-item')) {
        e.target.style.transform = 'translateY(-6px) scale(1.02)';
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('btn-primary')) {
        e.target.style.transform = 'translateY(0) scale(1)';
    }
    
    if (e.target.classList.contains('feature-card')) {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
    }
    
    if (e.target.classList.contains('example-item')) {
        e.target.style.transform = 'translateY(0) scale(1)';
    }
});

// Preload important elements for smooth animations
window.addEventListener('load', () => {
    // Pre-calculate important measurements
    const hero = document.querySelector('.hero');
    const features = document.querySelector('.features');
    
    if (hero) {
        hero.style.willChange = 'transform';
    }
    
    // Remove will-change after animations are done to save memory
    setTimeout(() => {
        document.querySelectorAll('[style*="will-change"]').forEach(el => {
            el.style.willChange = 'auto';
        });
    }, 5000);
});

// Error handling for any potential issues
window.addEventListener('error', (e) => {
    console.warn('LayoutCraft App: ', e.error);
});

// Export functions for potential external use
window.LayoutCraftApp = {
    initializeScrollAnimations,
    initializeSmoothScrolling,
    showGenerationSuccess
};