/**
 * Dashboard Manager for LayoutCraft
 * Manages dashboard state and data synchronization
 */

class DashboardManager {
    constructor() {
        this.currentView = 'overview';
        this.dashboardComponents = {};
        this.isVisible = false;
        this.refreshInterval = null;
    }

    init() {
        this.initializeComponents();
        this.setupEventListeners();
    }

    initializeComponents() {
        this.dashboardComponents = {
            usage: new UsageDashboard(),
            history: new GenerationHistory(),
            subscription: new SubscriptionManager(),
            premium: new PremiumFeatures()
        };
      }

    setupEventListeners() {
        // Listen for authentication changes
        document.addEventListener('loginSuccess', () => {
            this.refreshData();
        });

        document.addEventListener('logout', () => {
            this.hide();
        });

        // Listen for new generations
        document.addEventListener('generationComplete', () => {
            this.refreshData();
        });
    }

    async show(view = 'overview') {
        this.currentView = view;
        this.isVisible = true;

        // Initialize components if not already done
        if (!this.dashboardComponents.usage.stats) {
            await this.dashboardComponents.usage.init();
        }

        if (!this.dashboardComponents.history.generations.length) {
            await this.dashboardComponents.history.init();
        }

        // Start auto-refresh
        this.startAutoRefresh();

        // Show dashboard
        this.renderDashboard();
    }

    hide() {
        this.isVisible = false;
        this.stopAutoRefresh();

        // Hide dashboard modal/overlay
        const dashboardModal = document.getElementById('dashboard-modal');
        if (dashboardModal) {
            dashboardModal.style.display = 'none';
        }
    }

    switchView(view) {
        this.currentView = view;
        this.renderDashboard();
    }

    async refreshData() {
        if (!this.isVisible) return;

        try {
            // Refresh all components
            await Promise.all([
                this.dashboardComponents.usage.loadUserStats(),
                this.dashboardComponents.history.loadGenerations()
            ]);

            // Re-render if dashboard is visible
            if (this.isVisible) {
                this.renderDashboard();
            }
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    renderDashboard() {
        const dashboardModal = this.ensureDashboardModal();
        const content = this.getDashboardContent();

        dashboardModal.innerHTML = content;
        dashboardModal.style.display = 'flex';
    }

    ensureDashboardModal() {
        let modal = document.getElementById('dashboard-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dashboard-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            modal.style.display = 'none';
            document.body.appendChild(modal);
        }
        return modal;
    }
    getDashboardContent() {
        return `
          <div class="glass-card p-0 max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <!-- Dashboard Header -->
            <div class="p-6 border-b border-white border-opacity-10">
              <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <button onclick="window.dashboardManager.hide()" 
                        class="text-gray-400 hover:text-gray-600 p-2">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
      
              <!-- Dashboard Navigation -->
              <div class="flex items-center space-x-1 mt-6 overflow-x-auto">
                <button onclick="window.dashboardManager.switchView('overview')" 
                        class="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${this.currentView === 'overview' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white hover:bg-opacity-10'}">
                  Overview
                </button>
                <button onclick="window.dashboardManager.switchView('history')" 
                        class="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${this.currentView === 'history' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white hover:bg-opacity-10'}">
                  History
                </button>
                <button onclick="window.dashboardManager.switchView('premium')" 
                        class="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${this.currentView === 'premium' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white hover:bg-opacity-10'}">
                  Premium Features
                </button>
                <button onclick="window.dashboardManager.switchView('billing')" 
                        class="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${this.currentView === 'billing' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white hover:bg-opacity-10'}">
                  Billing
                </button>
                <button onclick="window.dashboardManager.switchView('settings')" 
                        class="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${this.currentView === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white hover:bg-opacity-10'}">
                  Settings
                </button>
              </div>
            </div>
      
            <!-- Dashboard Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              ${this.getDashboardViewContent()}
            </div>
          </div>
        `;
    }
    

    getDashboardViewContent() {
        switch (this.currentView) {
            case 'overview':
                return this.dashboardComponents.usage.render();
            case 'history':
                return this.dashboardComponents.history.render();
            case 'premium':
                return this.dashboardComponents.premium.render();
            case 'billing':
                return this.dashboardComponents.subscription.render();
            case 'settings':
                return this.getSettingsContent();
            default:
                return this.dashboardComponents.usage.render();
        }
      }

    getSettingsContent() {
        return `
        <div class="space-y-6">
          <div class="glass-card p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Account Settings</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Default Model</label>
                <select class="glass-input w-full p-3 rounded-lg">
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Quality)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Beta)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Default Dimensions</label>
                <div class="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Width" class="glass-input p-3 rounded-lg" value="1200">
                  <input type="number" placeholder="Height" class="glass-input p-3 rounded-lg" value="630">
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="flex items-center space-x-3">
                  <input type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked>
                  <span class="text-sm text-gray-700">Auto-save drafts</span>
                </label>
                
                <label class="flex items-center space-x-3">
                  <input type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked>
                  <span class="text-sm text-gray-700">Email notifications</span>
                </label>
              </div>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-200">
              <button class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                Save Settings
              </button>
            </div>
          </div>
  
          <div class="glass-card p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Danger Zone</h3>
            
            <div class="space-y-4">
              <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 class="font-medium text-red-900 mb-2">Export Data</h4>
                <p class="text-sm text-red-700 mb-4">Download all your generation data</p>
                <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Export Data
                </button>
              </div>
              
              <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 class="font-medium text-red-900 mb-2">Delete Account</h4>
                <p class="text-sm text-red-700 mb-4">Permanently delete your account and all data</p>
                <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
}

// Initialize dashboard manager
window.dashboardManager = new DashboardManager();
window.dashboardManager.init();
  