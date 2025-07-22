/**
 * Premium Features Component for LayoutCraft
 * Displays available premium features and manages access
 */

class PremiumFeatures {
    constructor() {
        this.features = null;
        this.isLoading = false;
        this.error = null;
        this.activeTab = 'templates';
        this.templates = [];
        this.brandKit = null;
    }

    async init() {
        await this.loadFeatures();
        await this.loadTemplates();
        await this.loadBrandKit();
    }

    async loadFeatures() {
        this.isLoading = true;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/premium/features', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load features');
            this.features = await response.json();
        } catch (error) {
            this.error = error.message;
            console.error('Error loading features:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadTemplates() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/premium/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.templates = data.templates;
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    async loadBrandKit() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/premium/brand-kit', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.brandKit = data.brand_kit;
            }
        } catch (error) {
            console.error('Error loading brand kit:', error);
        }
    }

    switchTab(tab) {
        this.activeTab = tab;
    }

    hasFeature(feature) {
        return this.features?.features?.[feature] || false;
    }

    showUpgradePrompt(featureName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
        <div class="glass-card p-6 max-w-md w-full">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Premium Feature</h3>
          <p class="text-gray-600 mb-6">
            ${featureName} is available for Pro and Enterprise users. Upgrade your plan to unlock this feature.
          </p>
          <div class="flex space-x-3">
            <button onclick="window.Alpine.store('auth').showUpgradePlan(); document.body.removeChild(this.closest('.fixed'))" 
                    class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
              Upgrade Now
            </button>
            <button onclick="document.body.removeChild(this.closest('.fixed'))" 
                    class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              Maybe Later
            </button>
          </div>
        </div>
      `;
        document.body.appendChild(modal);
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

        return `
        <div class="space-y-6">
          <!-- Feature Overview -->
          <div class="glass-card p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Premium Features</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Custom Templates -->
              <div class="p-4 border-2 rounded-lg ${this.hasFeature('custom_templates') ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                <div class="flex items-center mb-3">
                  <svg class="w-6 h-6 ${this.hasFeature('custom_templates') ? 'text-green-600' : 'text-gray-400'} mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 class="font-semibold">Custom Templates</h3>
                </div>
                <p class="text-sm text-gray-600 mb-3">Create reusable prompt templates for consistent branding</p>
                ${this.hasFeature('custom_templates') ?
                '<span class="text-green-600 text-sm font-medium">Available</span>' :
                '<button onclick="window.premiumFeatures.showUpgradePrompt(\'Custom Templates\')" class="text-indigo-600 text-sm font-medium hover:underline">Upgrade to unlock</button>'
            }
              </div>
  
              <!-- Advanced Export -->
              <div class="p-4 border-2 rounded-lg ${this.features?.features?.export_formats?.length > 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                <div class="flex items-center mb-3">
                  <svg class="w-6 h-6 ${this.features?.features?.export_formats?.length > 1 ? 'text-green-600' : 'text-gray-400'} mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 class="font-semibold">Advanced Export</h3>
                </div>
                <p class="text-sm text-gray-600 mb-3">Export in multiple formats: ${this.features?.features?.export_formats?.join(', ') || 'PNG only'}</p>
                ${this.features?.features?.export_formats?.length > 1 ?
                '<span class="text-green-600 text-sm font-medium">Available</span>' :
                '<button onclick="window.premiumFeatures.showUpgradePrompt(\'Advanced Export\')" class="text-indigo-600 text-sm font-medium hover:underline">Upgrade to unlock</button>'
            }
              </div>
  
              <!-- Priority Queue -->
              <div class="p-4 border-2 rounded-lg ${this.hasFeature('priority_queue') ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                <div class="flex items-center mb-3">
                  <svg class="w-6 h-6 ${this.hasFeature('priority_queue') ? 'text-green-600' : 'text-gray-400'} mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  <h3 class="font-semibold">Priority Processing</h3>
                </div>
                <p class="text-sm text-gray-600 mb-3">Get faster generation times with priority queue access</p>
                ${this.hasFeature('priority_queue') ?
                '<span class="text-green-600 text-sm font-medium">Available</span>' :
                '<button onclick="window.premiumFeatures.showUpgradePrompt(\'Priority Processing\')" class="text-indigo-600 text-sm font-medium hover:underline">Upgrade to unlock</button>'
            }
              </div>
            </div>
          </div>
  
          <!-- Feature Tabs -->
          ${this.hasFeature('custom_templates') ? `
            <div class="glass-card p-0 overflow-hidden">
              <!-- Tab Navigation -->
              <div class="border-b border-gray-200">
                <nav class="flex space-x-8 px-6">
                  <button onclick="window.premiumFeatures.switchTab('templates')" 
                          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors ${this.activeTab === 'templates'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }">
                    Custom Templates
                  </button>
                  <button onclick="window.premiumFeatures.switchTab('brand-kit')" 
                          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors ${this.activeTab === 'brand-kit'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }">
                    Brand Kit
                  </button>
                </nav>
              </div>
  
              <!-- Tab Content -->
              <div class="p-6">
                ${this.activeTab === 'templates' ? this.renderTemplatesTab() : this.renderBrandKitTab()}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    renderTemplatesTab() {
        return `
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Your Templates</h3>
            <button onclick="window.premiumFeatures.showCreateTemplate()" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Create Template
            </button>
          </div>
  
          ${this.templates.length === 0 ? `
            <div class="text-center py-12">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p class="text-gray-600 mb-4">Create your first template to save time on future generations</p>
              <button onclick="window.premiumFeatures.showCreateTemplate()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Create Your First Template
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${this.templates.map(template => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 class="font-medium text-gray-900 mb-2">${template.name}</h4>
                  <p class="text-sm text-gray-600 mb-3 line-clamp-2">${template.description || 'No description'}</p>
                  <div class="text-xs text-gray-500 mb-3">
                    ${template.default_width}×${template.default_height} • Used ${template.usage_count} times
                  </div>
                  <div class="flex space-x-2">
                    <button onclick="window.premiumFeatures.useTemplate('${template.id}')" 
                            class="flex-1 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors">
                      Use Template
                    </button>
                    <button onclick="window.premiumFeatures.editTemplate('${template.id}')" 
                            class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }

    renderBrandKitTab() {
        return `
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Brand Kit</h3>
            ${this.brandKit ? `
              <button onclick="window.premiumFeatures.editBrandKit()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Edit Brand Kit
              </button>
            ` : `
              <button onclick="window.premiumFeatures.createBrandKit()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Create Brand Kit
              </button>
            `}
          </div>
  
          ${!this.brandKit ? `
            <div class="text-center py-12">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No brand kit yet</h3>
              <p class="text-gray-600 mb-4">Create a brand kit to maintain consistent styling across all your generations</p>
              <button onclick="window.premiumFeatures.createBrandKit()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Create Brand Kit
              </button>
            </div>
          ` : `
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Brand Info -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                    <div class="text-lg font-semibold">${this.brandKit.brand_name}</div>
                  </div>
                  
                  ${this.brandKit.style_guidelines ? `
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Style Guidelines</label>
                      <div class="text-sm text-gray-600">${this.brandKit.style_guidelines}</div>
                    </div>
                  ` : ''}
                </div>
  
                <!-- Colors -->
                <div class="space-y-4">
                  ${this.brandKit.primary_colors?.length ? `
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Primary Colors</label>
                      <div class="flex space-x-2">
                        ${this.brandKit.primary_colors.map(color => `
                          <div class="w-8 h-8 rounded-full border-2 border-white shadow-md" 
                               style="background-color: ${color}" 
                               title="${color}"></div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
  
                  ${this.brandKit.secondary_colors?.length ? `
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Colors</label>
                      <div class="flex space-x-2">
                        ${this.brandKit.secondary_colors.map(color => `
                          <div class="w-8 h-8 rounded-full border-2 border-white shadow-md" 
                               style="background-color: ${color}" 
                               title="${color}"></div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
  
              ${this.brandKit.fonts?.length ? `
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Brand Fonts</label>
                  <div class="flex flex-wrap gap-2">
                    ${this.brandKit.fonts.map(font => `
                      <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">${font}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `}
        </div>
      `;
    }
}
  