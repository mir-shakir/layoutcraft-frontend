/**
 * Pricing Plans Component for LayoutCraft
 * Displays subscription plans and handles checkout
 */

class PricingPlans {
    constructor() {
        this.isLoading = false;
        this.plans = [];
        this.error = null;
    }

    async init() {
        await this.loadPlans();
    }

    async loadPlans() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await fetch('http://127.0.0.1:8000/billing/plans');

            if (!response.ok) {
                throw new Error('Failed to load pricing plans');
            }

            const data = await response.json();
            this.plans = data.plans;

        } catch (error) {
            this.error = error.message;
            console.error('Error loading plans:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async subscribeToPlan(planId) {
        if (!window.Alpine.store('auth').isAuthenticated) {
            window.Alpine.store('auth').showLoginModal = true;
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/billing/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan_type: planId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const data = await response.json();

            // Redirect to Stripe checkout
            window.location.href = data.checkout_url;

        } catch (error) {
            this.showMessage('Failed to start checkout. Please try again.', 'error');
            console.error('Checkout error:', error);
        }
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    render() {
        if (this.isLoading) {
            return `
          <div class="flex items-center justify-center h-64">
            <div class="loading-animation w-8 h-8"></div>
          </div>
        `;
        }

        if (this.error) {
            return `
          <div class="text-center text-red-600">
            <p>Error loading plans: ${this.error}</p>
            <button onclick="window.pricingPlans.loadPlans()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
              Try Again
            </button>
          </div>
        `;
        }

        return `
        <div class="space-y-8">
          <!-- Pricing Header -->
          <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p class="text-xl text-gray-600">Unlock more features and higher limits</p>
          </div>
  
          <!-- Plans Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <!-- Free Plan -->
            <div class="glass-card p-8 relative">
              <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div class="text-4xl font-bold text-gray-900 mb-1">$0</div>
                <div class="text-gray-500 mb-6">per month</div>
                
                <ul class="space-y-3 mb-8 text-left">
                  <li class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-gray-700">10 generations per month</span>
                  </li>
                  <li class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-gray-700">Basic AI model</span>
                  </li>
                  <li class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-gray-700">PNG export</span>
                  </li>
                  <li class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-gray-700">1200x630 max resolution</span>
                  </li>
                </ul>
                
                <button disabled class="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-semibold cursor-not-allowed">
                  Current Plan
                </button>
              </div>
            </div>
  
            ${this.plans.map(plan => `
              <div class="glass-card p-8 relative ${plan.id.includes('pro') ? 'ring-2 ring-indigo-500' : ''}">
                ${plan.discount ? `
                  <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ${plan.discount}
                    </span>
                  </div>
                ` : ''}
                
                <div class="text-center">
                  <h3 class="text-2xl font-bold text-gray-900 mb-2">${plan.name}</h3>
                  <div class="text-4xl font-bold text-gray-900 mb-1">$${plan.price}</div>
                  <div class="text-gray-500 mb-6">per ${plan.interval}</div>
                  
                  <ul class="space-y-3 mb-8 text-left">
                    ${plan.features.map(feature => `
                      <li class="flex items-center space-x-3">
                        <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="text-gray-700">${feature}</span>
                      </li>
                    `).join('')}
                  </ul>
                  
                  <button onclick="window.pricingPlans.subscribeToPlan('${plan.id}')" 
                          class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all">
                    Choose ${plan.name}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
}
  