/**
 * Authentication Guards for LayoutCraft
 * Handles route protection and access control
 */

class AuthGuard {
    constructor() {
        this.protectedRoutes = [
            '/api/generate',
            '/users/profile',
            '/users/history',
            '/users/preferences'
        ];
        this.init();
    }

    init() {
        this.setupRouteInterceptors();
        this.setupFormProtection();
        this.setupComponentVisibility();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
            return false;
        }

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;

            if (payload.exp && payload.exp < now) {
                // Token expired, clear storage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                return false;
            }

            return true;
        } catch (error) {
            // Invalid token format
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            return false;
        }
    }

    /**
     * Get current user data
     */
    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        try {
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if user has required subscription tier
     */
    hasSubscriptionTier(requiredTier) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const tierHierarchy = {
            'free': 0,
            'pro': 1,
            'enterprise': 2
        };

        const userTier = tierHierarchy[user.subscription_tier] || 0;
        const required = tierHierarchy[requiredTier] || 0;

        return userTier >= required;
    }

    /**
     * Check if user has remaining usage
     */
    hasUsageRemaining() {
        const user = this.getCurrentUser();
        if (!user) return false;

        const usageLimits = {
            'free': 10,
            'pro': 500,
            'enterprise': Infinity
        };

        const limit = usageLimits[user.subscription_tier] || 10;
        return user.usage_count < limit;
    }

    /**
     * Redirect to login if not authenticated
     */
    requireAuthentication(showMessage = true) {
        if (!this.isAuthenticated()) {
            if (showMessage) {
                this.showAuthRequiredMessage();
            }
            this.showLoginModal();
            return false;
        }
        return true;
    }

    /**
     * Check subscription tier requirement
     */
    requireSubscriptionTier(requiredTier, showMessage = true) {
        if (!this.isAuthenticated()) {
            return this.requireAuthentication(showMessage);
        }

        if (!this.hasSubscriptionTier(requiredTier)) {
            if (showMessage) {
                this.showUpgradeRequiredMessage(requiredTier);
            }
            return false;
        }
        return true;
    }

    /**
     * Check usage limits
     */
    requireUsageLimit(showMessage = true) {
        if (!this.isAuthenticated()) {
            return this.requireAuthentication(showMessage);
        }

        if (!this.hasUsageRemaining()) {
            if (showMessage) {
                this.showUsageLimitMessage();
            }
            return false;
        }
        return true;
    }

    /**
     * Setup route interceptors for API calls
     */
    setupRouteInterceptors() {
        // Store original fetch
        const originalFetch = window.fetch;

        // Override fetch to add authentication checks
        window.fetch = async (url, options = {}) => {
            // Check if this is a protected route
            const isProtectedRoute = this.protectedRoutes.some(route =>
                url.includes(route)
            );

            if (isProtectedRoute) {
                // Check authentication
                if (!this.isAuthenticated()) {
                    this.showAuthRequiredMessage();
                    this.showLoginModal();
                    throw new Error('Authentication required');
                }

                // Add auth header
                const token = localStorage.getItem('auth_token');
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };

                // Special handling for generate endpoint
                if (url.includes('/api/generate')) {
                    if (!this.hasUsageRemaining()) {
                        this.showUsageLimitMessage();
                        throw new Error('Usage limit exceeded');
                    }
                }
            }

            return originalFetch(url, options);
        };
    }

    /**
     * Setup form protection
     */
    setupFormProtection() {
        // Protect generation form
        document.addEventListener('DOMContentLoaded', () => {
            const generateForm = document.querySelector('form[data-auth-required]');
            if (generateForm) {
                generateForm.addEventListener('submit', (e) => {
                    if (!this.requireUsageLimit()) {
                        e.preventDefault();
                        return false;
                    }
                });
            }
        });
    }

    /**
     * Setup component visibility based on auth state
     */
    setupComponentVisibility() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updateComponentVisibility();
        });

        // Listen for auth state changes
        document.addEventListener('loginSuccess', () => {
            this.updateComponentVisibility();
        });

        document.addEventListener('logout', () => {
            this.updateComponentVisibility();
        });
    }

    /**
     * Update component visibility based on auth state
     */
    updateComponentVisibility() {
        const isAuth = this.isAuthenticated();
        const user = this.getCurrentUser();

        // Show/hide authenticated elements
        document.querySelectorAll('[data-auth-show]').forEach(element => {
            element.style.display = isAuth ? 'block' : 'none';
        });

        document.querySelectorAll('[data-auth-hide]').forEach(element => {
            element.style.display = isAuth ? 'none' : 'block';
        });

        // Show/hide tier-specific elements
        document.querySelectorAll('[data-tier-required]').forEach(element => {
            const requiredTier = element.getAttribute('data-tier-required');
            const hasAccess = this.hasSubscriptionTier(requiredTier);
            element.style.display = hasAccess ? 'block' : 'none';
        });

        // Update user-specific content
        if (user) {
            document.querySelectorAll('[data-user-name]').forEach(element => {
                element.textContent = user.full_name || user.email;
            });

            document.querySelectorAll('[data-user-email]').forEach(element => {
                element.textContent = user.email;
            });

            document.querySelectorAll('[data-user-tier]').forEach(element => {
                element.textContent = user.subscription_tier || 'free';
            });

            document.querySelectorAll('[data-user-usage]').forEach(element => {
                element.textContent = user.usage_count || 0;
            });
        }
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        // Trigger Alpine.js store action
        if (window.Alpine && window.Alpine.store('auth')) {
            window.Alpine.store('auth').showLoginModal = true;
        }
    }

    /**
     * Show various messages
     */
    showAuthRequiredMessage() {
        this.showNotification('Please log in to continue', 'info');
    }

    showUpgradeRequiredMessage(tier) {
        this.showNotification(`This feature requires ${tier} subscription. Please upgrade your plan.`, 'warning');
    }

    showUsageLimitMessage() {
        const user = this.getCurrentUser();
        const tier = user?.subscription_tier || 'free';

        if (tier === 'free') {
            this.showNotification('You have reached your monthly limit. Upgrade to Pro for more generations!', 'warning');
        } else {
            this.showNotification('You have reached your monthly limit. Please wait for the next billing cycle.', 'warning');
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            ${this.getNotificationIcon(type)}
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">${message}</p>
          </div>
          <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            info: `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`,
            warning: `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>`,
            error: `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`,
            success: `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`
        };
        return icons[type] || icons.info;
    }
}

// Initialize auth guard
const authGuard = new AuthGuard();

// Export for use in other modules
window.authGuard = authGuard;
  