/**
 * Profile Dropdown Component for LayoutCraft
 * Handles authenticated user profile display and actions
 */

class ProfileDropdown {
    constructor() {
        this.isOpen = false;
        this.user = null;
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    close() {
        this.isOpen = false;
    }

    async handleLogout() {
        try {
            // Clear local storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');

            // Trigger logout event
            document.dispatchEvent(new CustomEvent('logout'));

            // Close dropdown
            this.close();

            // Show success message
            this.showMessage('Logged out successfully', 'success');

        } catch (error) {
            this.showMessage('Logout failed. Please try again.', 'error');
        }
    }

    showMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
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

    render() {
        return `
        <div class="relative" x-data="{ isOpen: false }" @click.away="isOpen = false">
          <!-- Profile Button -->
          <button @click="isOpen = !isOpen" 
                  class="flex items-center space-x-3 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all">
            <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span class="text-white font-medium text-sm" 
                    x-text="$store.auth.user?.full_name?.charAt(0) || $store.auth.user?.email?.charAt(0) || 'U'"></span>
            </div>
            <div class="hidden md:block text-left">
              <p class="text-sm font-medium text-gray-900" x-text="$store.auth.user?.full_name || 'User'"></p>
              <p class="text-xs text-gray-500" x-text="$store.auth.user?.subscription_tier || 'free'"></p>
            </div>
            <svg class="w-4 h-4 text-gray-500 transition-transform" 
                 :class="{ 'rotate-180': isOpen }"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
  
          <!-- Dropdown Menu -->
          <div x-show="isOpen" 
               x-transition:enter="transition ease-out duration-200"
               x-transition:enter-start="opacity-0 transform scale-95"
               x-transition:enter-end="opacity-100 transform scale-100"
               x-transition:leave="transition ease-in duration-150"
               x-transition:leave-start="opacity-100 transform scale-100"
               x-transition:leave-end="opacity-0 transform scale-95"
               class="absolute right-0 mt-2 w-56 glass-card rounded-lg shadow-lg z-50">
            
            <!-- User Info -->
            <div class="px-4 py-3 border-b border-white border-opacity-10">
              <p class="text-sm font-medium text-gray-900" x-text="$store.auth.user?.full_name || 'User'"></p>
              <p class="text-xs text-gray-500" x-text="$store.auth.user?.email"></p>
              <div class="flex items-center mt-1">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  <span x-text="$store.auth.user?.subscription_tier || 'free'"></span>
                </span>
              </div>
            </div>
  
            <!-- Usage Stats -->
            <div class="px-4 py-3 border-b border-white border-opacity-10">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Usage this month</span>
                <span class="font-medium" x-text="$store.auth.user?.usage_count || 0"></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                     :style="{ width: Math.min(($store.auth.user?.usage_count || 0) / 10 * 100, 100) + '%' }"></div>
              </div>
            </div>
  
            <!-- Menu Items -->
            <div class="py-2">
              <button @click="$store.auth.showDashboard(); isOpen = false"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white hover:bg-opacity-10 transition-colors">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Dashboard
              </button>
              
              <button @click="$store.auth.showGenerationHistory(); isOpen = false"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white hover:bg-opacity-10 transition-colors">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Generation History
              </button>
              
              <button @click="$store.auth.showAccountSettings(); isOpen = false"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white hover:bg-opacity-10 transition-colors">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Account Settings
              </button>
  
              <div class="border-t border-white border-opacity-10 mt-2 pt-2">
                <button @click="$store.auth.showUpgradePlan(); isOpen = false"
                        class="flex items-center w-full px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 hover:bg-opacity-10 transition-colors">
                  <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Upgrade Plan
                </button>
                
                <button @click="$store.auth.handleLogout(); isOpen = false"
                        class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:bg-opacity-10 transition-colors">
                  <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
}
  