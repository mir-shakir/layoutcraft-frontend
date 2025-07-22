/**
 * Application Initialization for LayoutCraft
 * Coordinates all components and services
 */

class AppInitializer {
    constructor() {
        this.components = {};
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Initialize core components
            await this.initializeComponents();

            // Setup event listeners
            this.setupGlobalEventListeners();

            // Initialize premium features
            this.initializePremiumFeatures();

            this.isInitialized = true;
            console.log('✅ LayoutCraft application initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize LayoutCraft:', error);
        }
    }

    async initializeComponents() {
        // Initialize pricing components
        this.components.pricingPlans = new PricingPlans();
        this.components.subscriptionStatus = new SubscriptionStatus();

        // Make components globally available
        window.pricingPlans = this.components.pricingPlans;
        window.subscriptionStatus = this.components.subscriptionStatus;

        // Initialize dashboard components if they exist
        if (window.dashboardManager) {
            await window.dashboardManager.init();
        }
    }

    setupGlobalEventListeners() {
        // Listen for subscription changes
        document.addEventListener('subscriptionUpdated', () => {
            this.components.subscriptionStatus.loadSubscription();
            if (window.premiumIndicators) {
                window.premiumIndicators.loadUserTier();
            }
        });

        // Listen for successful payments
        document.addEventListener('paymentSuccess', () => {
            // Refresh user data and UI
            if (window.Alpine?.store('auth')) {
                window.Alpine.store('auth').refreshUserData();
            }
        });
    }

    initializePremiumFeatures() {
        // Premium indicators are already initialized via their own script
        // Just ensure they're working correctly
        if (window.premiumIndicators) {
            window.premiumIndicators.init();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const appInitializer = new AppInitializer();
    await appInitializer.init();
});
  