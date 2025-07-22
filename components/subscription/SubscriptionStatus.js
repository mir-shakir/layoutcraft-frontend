/**
 * Subscription Status Component for LayoutCraft
 * Displays current subscription status and management options
 */

class SubscriptionStatus {
    constructor() {
        this.isLoading = false;
        this.subscription = null;
        this.error = null;
    }

    async init() {
        await this.loadSubscription();
    }

    async loadSubscription() {
        this.isLoading = true;
        this.error = null;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/billing/subscription', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load subscription');
            }

            this.subscription = await response.json();

        } catch (error) {
            this.error = error.message;
            console.error('Error loading subscription:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async openCustomerPortal() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/billing/create-portal', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create portal session');
            }

            const data = await response.json();
            window.location.href = data.portal_url;

        } catch (error) {
            this.showMessage('Failed to open billing portal. Please try again.', 'error');
            console.error('Portal error:', error);
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
          <div class="glass-card p-6">
            <div class="flex items-center justify-center h-32">
              <div class="loading-animation w-6 h-6"></div>
            </div>
          </div>
        `;
        }

        if (this.error) {
            return `
          <div class="glass-card p-6">
            <div class="text-center text-red-600">
              <p>Error loading subscription: ${this.error}</p>
              <button onclick="window.subscriptionStatus.loadSubscription()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
                Try Again
              </button>
            </div>
          </div>
        `;
        }

        const sub = this.subscription;

        if (sub.tier === 'free') {
            return `
          <div class="glass-card p-6">
            <div class="text-center">
              <h3 class="text-xl font-bold text-gray-900 mb-4">Free Plan</h3>
              <p class="text-gray-600 mb-6">You're currently on the free plan</p>
              <button onclick="window.Alpine.store('auth').showUpgradePlan()" 
                      class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                Upgrade Now
              </button>
            </div>
          </div>
        `;
        }

        return `
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Subscription</h3>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
              ${sub.status}
            </span>
          </div>
  
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Plan</span>
              <span class="text-sm text-gray-900 capitalize">${sub.tier}</span>
            </div>
            
            ${sub.current_period_end ? `
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Next billing</span>
                <span class="text-sm text-gray-900">${new Date(sub.current_period_end).toLocaleDateString()}</span>
              </div>
            ` : ''}
            
            ${sub.cancel_at_period_end ? `
              <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800">Your subscription will cancel at the end of the current period.</p>
              </div>
            ` : ''}
          </div>
  
          <div class="mt-6 pt-6 border-t border-gray-200">
            <button onclick="window.subscriptionStatus.openCustomerPortal()" 
                    class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all">
              Manage Subscription
            </button>
          </div>
        </div>
      `;
    }
}
  