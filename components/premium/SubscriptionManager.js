/**
 * Subscription Manager Component for LayoutCraft
 * Handles subscription plans, upgrades, and billing management
 */

class SubscriptionManager {
    constructor() {
        this.isLoading = false;
        this.plans = [];
        this.currentSubscription = null;
        this.error = null;
        this.showConfirmDialog = false;
        this.selectedPlan = null;
    }

    async init() {
        await this.loadPlans();
        await this.loadCurrentSubscription();
    }

    async loadPlans() {
        this.isLoading = true;
        try {
            const response = await fetch('http://127.0.0.1:8000/billing/plans');
            if (!response.ok) throw new Error('Failed to load plans');

            const data = await response.json();
            this.plans = data.plans;
        } catch (error) {
            this.error = error.message;
            console.error('Error loading plans:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadCurrentSubscription() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/billing/subscription', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.currentSubscription = await response.json();
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        }
    }

    async selectPlan(planId) {
        this.selectedPlan = planId;
        this.showConfirmDialog = true;
    }

    async confirmUpgrade() {
        if (!this.selectedPlan) return;

        this.isLoading = true;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/billing/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan_type: this.selectedPlan })
            });

            if (!response.ok) throw new Error('Failed to create checkout session');

            const data = await response.json();
            window.location.href = data.checkout_url;

        } catch (error) {
            this.error = error.message;
            console.error('Error creating checkout:', error);
        } finally {
            this.isLoading = false;
            this.showConfirmDialog = false;
        }
    }

    async openCustomerPortal() {
        this.isLoading = true;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/billing/create-portal', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to open customer portal');

            const data = await response.json();
            window.open(data.portal_url, '_blank');

        } catch (error) {
            this.error = error.message;
            console.error('Error opening portal:', error);
        } finally {
            this.isLoading = false;
        }
    }

    getPlanBadge(planId) {
        const currentTier = this.currentSubscription?.tier || 'free';
        const planTier = planId.split('_')[0];

        if (planTier === currentTier) {
            return '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Current Plan</span>';
        }

        const tierHierarchy = { 'free': 0, 'pro': 1, 'enterprise': 2 };
        if (tierHierarchy[planTier] < tierHierarchy[currentTier]) {
            return '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">Downgrade</span>';
        }

        return '<span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">Upgrade</span>';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    render() {
        if (this.isLoading && this.plans.length === 0) {
            return `
          <div class="glass-card p-6">
            <div class="flex items-center justify-center h-64">
              <div class="loading-animation w-8 h-8"></div>
            </div>
          </div>
        `;
        }

        return `
        <div class="space-y-8">
          <!-- Current Subscription Status -->
          ${this.currentSubscription ? `
            <div class="glass-card p-6">
              <h3 class="text-xl font-bold text-gray-900 mb-4">Current Subscription</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div class="text-sm text-gray-600">Plan</div>
                  <div class="text-lg font-semibold capitalize">${this.currentSubscription.tier}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-600">Status</div>
                  <div class="text-lg font-semibold">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.currentSubscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }">
                      ${this.currentSubscription.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-600">Next Billing</div>
                  <div class="text-lg font-semibold">
                    ${this.currentSubscription.current_period_end ?
                    new Date(this.currentSubscription.current_period_end).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              
              ${this.currentSubscription.tier !== 'free' ? `
                <div class="mt-6 pt-6 border-t border-gray-200">
                  <button onclick="window.subscriptionManager.openCustomerPortal()" 
                          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Manage Subscription
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}
  
          <!-- Subscription Plans -->
          <div class="glass-card p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- Free Plan -->
              <div class="border-2 border-gray-200 rounded-xl p-6 relative ${this.currentSubscription?.tier === 'free' ? 'border-green-500 bg-green-50' : ''
            }">
                <div class="text-center">
                  <h3 class="text-xl font-bold text-gray-900 mb-2">Free</h3>
                  <div class="text-3xl font-bold text-gray-900 mb-1">$0</div>
                  <div class="text-sm text-gray-600 mb-6">per month</div>
                  
                  <ul class="space-y-3 text-sm text-gray-600 mb-6">
                    <li class="flex items-center">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      10 generations/month
                    </li>
                    <li class="flex items-center">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      Basic model access
                    </li>
                    <li class="flex items-center">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      PNG export
                    </li>
                  </ul>
  
                  ${this.currentSubscription?.tier === 'free' ?
                '<div class="text-green-600 font-medium">Current Plan</div>' :
                '<button disabled class="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed">Current Plan</button>'
            }
                </div>
              </div>
  
              ${this.plans.map(plan => `
                <div class="border-2 rounded-xl p-6 relative transition-all hover:shadow-lg ${plan.id.includes('pro') ? 'border-indigo-500' : 'border-purple-500'
                } ${this.currentSubscription?.tier === plan.id.split('_')[0] ? 'bg-indigo-50' : ''}">
                  
                  ${plan.discount ? `
                    <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        ${plan.discount}
                      </span>
                    </div>
                  ` : ''}
  
                  <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${plan.name}</h3>
                    <div class="text-3xl font-bold text-gray-900 mb-1">${this.formatPrice(plan.price)}</div>
                    <div class="text-sm text-gray-600 mb-6">per ${plan.interval}</div>
                    
                    <ul class="space-y-3 text-sm text-gray-600 mb-6 text-left">
                      ${plan.features.map(feature => `
                        <li class="flex items-center">
                          <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                          ${feature}
                        </li>
                      `).join('')}
                    </ul>
  
                    <div class="mb-4">${this.getPlanBadge(plan.id)}</div>
  
                    <button onclick="window.subscriptionManager.selectPlan('${plan.id}')" 
                            class="w-full py-3 px-4 rounded-lg font-semibold transition-all ${plan.id.includes('pro')
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                }">
                      ${this.currentSubscription?.tier === plan.id.split('_')[0] ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
  
          <!-- Upgrade Confirmation Dialog -->
          ${this.showConfirmDialog ? `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div class="glass-card p-6 max-w-md w-full">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Confirm Subscription</h3>
                <p class="text-gray-600 mb-6">
                  You're about to upgrade to the ${this.selectedPlan} plan. You'll be redirected to Stripe for secure payment.
                </p>
                <div class="flex space-x-3">
                  <button onclick="window.subscriptionManager.confirmUpgrade()" 
                          class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    Continue to Payment
                  </button>
                  <button onclick="window.subscriptionManager.showConfirmDialog = false; window.subscriptionManager.render()" 
                          class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ` : ''}
  
          <!-- Error Message -->
          ${this.error ? `
            <div class="glass-card p-4 border-l-4 border-red-500 bg-red-50">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-red-700">${this.error}</span>
                <button onclick="window.subscriptionManager.error = null; window.subscriptionManager.render()" 
                        class="ml-auto text-red-500 hover:text-red-700">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
}
  