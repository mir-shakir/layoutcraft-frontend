/**
 * Premium Feature Indicators for LayoutCraft
 * Shows upgrade prompts and feature restrictions
 */

class PremiumIndicators {
    constructor() {
        this.userTier = 'free';
        this.tierFeatures = {};
    }

    init() {
        this.loadUserTier();
        this.updateAllIndicators();
        this.setupEventListeners();
    }

    async loadUserTier() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/premium/features', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userTier = data.tier;
                this.tierFeatures = data.features;
                this.updateAllIndicators();
            }
        } catch (error) {
            console.error('Error loading tier features:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('loginSuccess', () => {
            this.loadUserTier();
        });

        document.addEventListener('logout', () => {
            this.userTier = 'free';
            this.updateAllIndicators();
        });
    }

    updateAllIndicators() {
        this.updateDimensionInputs();
        this.updateModelSelector();
        this.updateExportOptions();
        this.updateFeatureLocks();
    }

    updateDimensionInputs() {
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');

        if (widthInput && heightInput && this.tierFeatures) {
            widthInput.max = this.tierFeatures.max_width || 1200;
            heightInput.max = this.tierFeatures.max_height || 630;

            // Add upgrade indicators
            this.addUpgradeIndicator(widthInput.parentElement,
                `Max ${this.tierFeatures.max_width}x${this.tierFeatures.max_height} resolution`);
        }
    }

    updateModelSelector() {
        const modelSelect = document.getElementById('model');
        if (modelSelect && this.tierFeatures.available_models) {
            const options = modelSelect.querySelectorAll('option');
            options.forEach(option => {
                const isAvailable = this.tierFeatures.available_models.includes(option.value);
                option.disabled = !isAvailable;

                if (!isAvailable) {
                    option.textContent += ' (Pro)';
                }
            });
        }
    }

    updateExportOptions() {
        // Add export format restrictions
        const exportFormats = document.querySelectorAll('[data-export-format]');
        exportFormats.forEach(element => {
            const format = element.dataset.exportFormat;
            const isAvailable = this.tierFeatures.export_formats?.includes(format) || false;

            if (!isAvailable) {
                element.classList.add('premium-locked');
                this.addUpgradeIndicator(element, `${format.toUpperCase()} export requires Pro`);
            }
        });
    }

    updateFeatureLocks() {
        // Lock premium features for free users
        if (this.userTier === 'free') {
            document.querySelectorAll('[data-premium-feature]').forEach(element => {
                element.classList.add('premium-locked');
                element.addEventListener('click', this.showUpgradePrompt.bind(this));
            });
        }
    }

    addUpgradeIndicator(element, message) {
        if (this.userTier === 'free') {
            const indicator = document.createElement('div');
            indicator.className = 'premium-indicator';
            indicator.innerHTML = `
          <div class="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>${message}</span>
            <button onclick="window.Alpine.store('auth').showUpgradePlan()" class="text-indigo-600 hover:text-indigo-800 font-medium">
              Upgrade
            </button>
          </div>
        `;
            element.appendChild(indicator);
        }
    }

    showUpgradePrompt(event) {
        if (this.userTier === 'free') {
            event.preventDefault();
            window.Alpine.store('auth').showUpgradePlan();
        }
    }
}

// Initialize premium indicators
window.premiumIndicators = new PremiumIndicators();
document.addEventListener('DOMContentLoaded', () => {
    window.premiumIndicators.init();
});
  