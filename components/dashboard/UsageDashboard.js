/**
 * Usage Dashboard Component for LayoutCraft
 * Displays user usage statistics and analytics
 */

class UsageDashboard {
    constructor() {
        this.isLoading = false;
        this.stats = null;
        this.error = null;
    }

    async init() {
        await this.loadUserStats();
        this.setupAutoRefresh();
    }

    async loadUserStats() {
        this.isLoading = true;
        this.error = null;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/users/analytics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load user statistics');
            }

            this.stats = await response.json();
        } catch (error) {
            this.error = error.message;
            console.error('Error loading user stats:', error);
        } finally {
            this.isLoading = false;
        }
    }

    setupAutoRefresh() {
        // Refresh stats every 5 minutes
        setInterval(() => {
            this.loadUserStats();
        }, 300000);
    }

    formatGenerationTime(ms) {
        if (!ms) return 'N/A';
        const seconds = Math.round(ms / 1000);
        return `${seconds}s`;
    }

    getUsagePercentage() {
        if (!this.stats?.user_stats) return 0;

        const { usage_count, usage_limit } = this.stats.user_stats;
        if (!usage_limit) return 0;

        return Math.min((usage_count / usage_limit) * 100, 100);
    }

    getUsageStatusColor() {
        const percentage = this.getUsagePercentage();
        if (percentage >= 90) return 'text-red-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-green-600';
    }

    render() {
        if (this.isLoading) {
            return `
          <div class="glass-card p-6">
            <div class="flex items-center justify-center h-64">
              <div class="loading-animation w-8 h-8"></div>
            </div>
          </div>
        `;
        }

        if (this.error) {
            return `
          <div class="glass-card p-6">
            <div class="text-center text-red-600">
              <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-lg font-medium mb-2">Error Loading Dashboard</p>
              <p class="text-sm">${this.error}</p>
              <button onclick="window.dashboardManager.loadUserStats()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Try Again
              </button>
            </div>
          </div>
        `;
        }

        const userStats = this.stats?.user_stats || {};
        const generationStats = this.stats?.generation_stats || {};

        return `
        <div class="space-y-6">
          <!-- Usage Overview -->
          <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Usage Overview</h2>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                ${userStats.subscription_tier || 'Free'}
              </span>
            </div>
  
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- Current Usage -->
              <div class="text-center">
                <div class="text-3xl font-bold ${this.getUsageStatusColor()}">${userStats.usage_count || 0}</div>
                <div class="text-sm text-gray-500">Generations Used</div>
                <div class="text-xs text-gray-400 mt-1">
                  of ${userStats.usage_limit || 'unlimited'} this month
                </div>
              </div>
  
              <!-- Remaining Usage -->
              <div class="text-center">
                <div class="text-3xl font-bold text-gray-900">
                  ${userStats.usage_remaining === null ? '∞' : userStats.usage_remaining}
                </div>
                <div class="text-sm text-gray-500">Remaining</div>
                <div class="text-xs text-gray-400 mt-1">
                  Resets ${new Date(userStats.usage_reset_date).toLocaleDateString()}
                </div>
              </div>
  
              <!-- Total Generations -->
              <div class="text-center">
                <div class="text-3xl font-bold text-gray-900">${userStats.total_generations || 0}</div>
                <div class="text-sm text-gray-500">Total Created</div>
                <div class="text-xs text-gray-400 mt-1">All time</div>
              </div>
  
              <!-- Recent Activity -->
              <div class="text-center">
                <div class="text-3xl font-bold text-gray-900">${generationStats.recent_generations || 0}</div>
                <div class="text-sm text-gray-500">This Week</div>
                <div class="text-xs text-gray-400 mt-1">Last 7 days</div>
              </div>
            </div>
  
            <!-- Usage Progress Bar -->
            <div class="mt-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Monthly Usage</span>
                <span class="text-sm text-gray-500">${this.getUsagePercentage().toFixed(1)}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" 
                     style="width: ${this.getUsagePercentage()}%"></div>
              </div>
            </div>
          </div>
  
          <!-- Generation Statistics -->
          <div class="glass-card p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Generation Statistics</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Performance Stats -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Average Generation Time</span>
                  <span class="text-sm text-gray-900">${this.formatGenerationTime(generationStats.avg_generation_time)}</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Most Used Model</span>
                  <span class="text-sm text-gray-900">${generationStats.most_used_model || 'N/A'}</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Preferred Dimensions</span>
                  <span class="text-sm text-gray-900">${generationStats.most_common_dimensions || 'N/A'}</span>
                </div>
              </div>
  
              <!-- Activity Timeline -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">First Generation</span>
                  <span class="text-sm text-gray-900">
                    ${generationStats.first_generation ? new Date(generationStats.first_generation).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Last Generation</span>
                  <span class="text-sm text-gray-900">
                    ${generationStats.last_generation ? new Date(generationStats.last_generation).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Account Age</span>
                  <span class="text-sm text-gray-900">
                    ${userStats.account_created ? Math.floor((Date.now() - new Date(userStats.account_created).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Upgrade Prompt (for free users) -->
          ${userStats.subscription_tier === 'free' ? `
            <div class="glass-card p-6 border-l-4 border-indigo-500">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Upgrade to Pro</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    Get 500 generations per month and access to premium features
                  </p>
                </div>
                <button onclick="window.Alpine.store('auth').showUpgradePlan()" 
                        class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                  Upgrade Now
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
}
  