/**
 * UI utility functions for LayoutCraft
 */

class UIManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupResizeHandlers();
        this.setupAnimationObserver();
    }

    // Setup scroll effects
    setupScrollEffects() {
        let ticking = false;

        function updateScrollEffects() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            const floatingElements = document.querySelectorAll('.animate-float, .animate-float-delayed');
            floatingElements.forEach(element => {
                element.style.transform = `translateY(${rate}px)`;
            });

            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick);
    }

    // Setup resize handlers
    setupResizeHandlers() {
        const debounced = this.debounce(() => {
            this.handleResize();
        }, 250);

        window.addEventListener('resize', debounced);
    }

    // Handle resize
    handleResize() {
        // Update any size-dependent elements
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Update CSS custom properties
        document.documentElement.style.setProperty('--viewport-width', `${viewportWidth}px`);
        document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
    }

    // Setup intersection observer for animations
    setupAnimationObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });

        // Observe elements that should animate on scroll
        document.querySelectorAll('.glass-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Debounce utility
    debounce(func, wait) {
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

    // Animate element
    animateElement(element, animation, duration = 300) {
        element.style.animation = `${animation} ${duration}ms ease-out`;

        return new Promise(resolve => {
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;

        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// Create global UI manager instance
const uiManager = new UIManager();

// Export for use in other modules
window.uiManager = uiManager;
  