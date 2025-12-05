import { authService } from './authService.js';

class SubscriptionService {
    constructor() {
        this.subscription = null;
        this.hasFetched = false;
    }

    async fetchSubscription() {
        if (!authService.hasToken() || authService.isTokenExpired()) {
            this.subscription = null;
            this.hasFetched = true;
            authService.logout();
            return;
        }
        
        try {
            // We will make this API call in a later phase.
            // For now, we will use mock data from the user object.
            authService.refreshUserProfile();
            const user = authService.getCurrentUser();
            if (user && user.subscription_tier) {
                 this.subscription = {
                    plan: user.subscription_tier,
                    status: "active", // Assuming active for mock data
                    trial_ends_at: user.trial_ends_at
                };
            } else {
                // Default to a free plan if data is missing
                this.subscription = { plan: 'free', status: 'active', trial_ends_at: null };
            }
            this.hasFetched = true;
        } catch (error) {
            console.error("Failed to fetch subscription status:", error);
            this.subscription = { plan: 'free', status: 'active', trial_ends_at: null };
            this.hasFetched = true;
        }
    }

    getSubscription() {
        if(this.subscription === null && !this.hasFetched) {
            this.fetchSubscription();
        }
        return this.subscription;
    }

    clearSubscription() {
        this.subscription = null;
        this.hasFetched = false;
    }

    isOnTrialOrPro() {
        // if(1===1) return true; // TEMPORARY OVERRIDE TO ALWAYS ENABLE PRO FEATURES
        if (!this.subscription) return false;
        return this.subscription.status === 'active' && ((this.subscription.plan === 'pro') || (this.subscription.plan === 'pro-trial' && new Date(this.subscription.trial_ends_at) > new Date()));
        // const isTrialing = this.subscription.plan === 'pro-trial' && new Date(this.subscription.trial_ends_at) > new Date();
        // const isActive = this.subscription.status === 'active';
        // return this.subscription.plan === 'pro' && (isTrialing || isActive);
    }
    isPro() {
        if (!this.subscription) return false;
        return this.subscription.status === 'active' && this.subscription.plan === 'pro';
    }

    isOnTrial() {
        if (!this.subscription) return false;
        return this.subscription.plan === 'pro-trial' && new Date(this.subscription.trial_ends_at) > new Date();
    }
    fetchAndCheckIfTrialing() {
        //this method fetches the subscription and checks if the user is on a pro trial
        return new Promise(async (resolve, reject) => {
            try {
                await this.fetchSubscription();
                if (!this.subscription) {
                    resolve(false);
                    return;
                }
                const isTrialing = this.subscription.plan === 'pro-trial' && new Date(this.subscription.trial_ends_at) > new Date();
                resolve(isTrialing);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export const subscriptionService = new SubscriptionService();