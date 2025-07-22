/**
 * Protected Components for LayoutCraft
 * Alpine.js directives for handling authentication-based visibility
 */

document.addEventListener('alpine:init', () => {
    // Custom directive for authentication-required elements
    Alpine.directive('auth-required', (el, { expression }, { evaluate }) => {
        const checkAuth = () => {
            const isAuthenticated = window.authGuard?.isAuthenticated() || false;

            if (!isAuthenticated) {
                el.style.display = 'none';

                // Add click handler to show login modal
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.authGuard?.showAuthRequiredMessage();
                    window.authGuard?.showLoginModal();
                });
            } else {
                el.style.display = '';
            }
        };

        // Initial check
        checkAuth();

        // Listen for auth changes
        document.addEventListener('loginSuccess', checkAuth);
        document.addEventListener('logout', checkAuth);
    });

    // Custom directive for tier-required elements
    Alpine.directive('tier-required', (el, { expression }, { evaluate }) => {
        const requiredTier = expression || 'pro';

        const checkTier = () => {
            const hasAccess = window.authGuard?.hasSubscriptionTier(requiredTier) || false;

            if (!hasAccess) {
                el.style.display = 'none';

                // Add click handler to show upgrade message
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.authGuard?.showUpgradeRequiredMessage(requiredTier);
                });
            } else {
                el.style.display = '';
            }
        };

        // Initial check
        checkTier();

        // Listen for auth changes
        document.addEventListener('loginSuccess', checkTier);
        document.addEventListener('logout', checkTier);
    });

    // Custom directive for usage-dependent elements
    Alpine.directive('usage-required', (el, { expression }, { evaluate }) => {
        const checkUsage = () => {
            const hasUsage = window.authGuard?.hasUsageRemaining() || false;

            if (!hasUsage) {
                el.classList.add('opacity-50', 'cursor-not-allowed');
                el.setAttribute('disabled', 'disabled');

                // Add click handler to show usage limit message
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.authGuard?.showUsageLimitMessage();
                });
            } else {
                el.classList.remove('opacity-50', 'cursor-not-allowed');
                el.removeAttribute('disabled');
            }
        };

        // Initial check
        checkUsage();

        // Listen for auth changes
        document.addEventListener('loginSuccess', checkUsage);
        document.addEventListener('logout', checkUsage);
    });
});
  