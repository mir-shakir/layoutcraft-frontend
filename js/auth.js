/**
 * Authentication State Management for LayoutCraft
 * Handles user authentication, state management, and API integration
 */

// Authentication Store for Alpine.js
document.addEventListener('alpine:init', () => {
    Alpine.store('auth', {
        // State
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,

        // Modal states
        showLoginModal: false,
        showRegisterModal: false,
        showForgotPasswordModal: false,
        showAccountSettings: false,
        showDashboard: false,

        // Form states
        loginForm: {
            email: '',
            password: ''
        },
        registerForm: {
            email: '',
            password: '',
            confirmPassword: '',
            full_name: '',
            acceptTerms: false
        },

        // Error states
        loginErrors: {},
        registerErrors: {},

        // UI states
        showPassword: false,
        showConfirmPassword: false,

        // Initialization
        init() {
            this.checkAuthState();
            this.setupEventListeners();
        },

        // Check if user is authenticated on page load
        checkAuthState() {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('user_data');

            if (token && userData) {
                try {
                    this.token = token;
                    this.user = JSON.parse(userData);
                    this.isAuthenticated = true;
                    this.setupAuthHeaders();
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    this.logout();
                }
            }
        },

        // Setup event listeners
        setupEventListeners() {
            // Listen for authentication events
            document.addEventListener('loginSuccess', (event) => {
                this.handleLoginSuccess(event.detail);
            });

            document.addEventListener('registrationSuccess', (event) => {
                this.handleRegistrationSuccess(event.detail);
            });

            document.addEventListener('logout', () => {
                this.handleLogout();
            });

            // Setup API interceptors
            this.setupApiInterceptors();
        },

        // Setup API request interceptors
        setupApiInterceptors() {
            // Store original fetch
            const originalFetch = window.fetch;

            // Override fetch to add auth headers
            window.fetch = async (url, options = {}) => {
                // Add auth header if token exists
                if (this.token && !options.headers?.Authorization) {
                    options.headers = {
                        ...options.headers,
                        'Authorization': `Bearer ${this.token}`
                    };
                }

                try {
                    const response = await originalFetch(url, options);

                    // Handle 401 Unauthorized responses
                    if (response.status === 401 && this.isAuthenticated) {
                        this.handleTokenExpiration();
                    }

                    return response;
                } catch (error) {
                    console.error('API request failed:', error);
                    throw error;
                }
            };
        },

        // Modal management
        showLoginModal() {
            this.showLoginModal = true;
            this.clearLoginErrors();
            this.clearLoginForm();
        },

        hideLoginModal() {
            this.showLoginModal = false;
            this.clearLoginErrors();
        },

        showRegisterModal() {
            this.showRegisterModal = true;
            this.clearRegisterErrors();
            this.clearRegisterForm();
        },

        hideRegisterModal() {
            this.showRegisterModal = false;
            this.clearRegisterErrors();
        },

        // Form management
        clearLoginForm() {
            this.loginForm = {
                email: '',
                password: ''
            };
        },

        clearRegisterForm() {
            this.registerForm = {
                email: '',
                password: '',
                confirmPassword: '',
                full_name: '',
                acceptTerms: false
            };
        },

        clearLoginErrors() {
            this.loginErrors = {};
        },

        clearRegisterErrors() {
            this.registerErrors = {};
        },

        // Validation
        validateLoginForm() {
            const errors = {};

            if (!this.loginForm.email) {
                errors.email = 'Email is required';
            } else if (!this.isValidEmail(this.loginForm.email)) {
                errors.email = 'Please enter a valid email address';
            }

            if (!this.loginForm.password) {
                errors.password = 'Password is required';
            }

            this.loginErrors = errors;
            return Object.keys(errors).length === 0;
        },

        validateRegisterForm() {
            const errors = {};

            // Email validation
            if (!this.registerForm.email) {
                errors.email = 'Email is required';
            } else if (!this.isValidEmail(this.registerForm.email)) {
                errors.email = 'Please enter a valid email address';
            }

            // Name validation
            if (!this.registerForm.full_name) {
                errors.full_name = 'Full name is required';
            } else if (this.registerForm.full_name.length < 2) {
                errors.full_name = 'Full name must be at least 2 characters';
            }

            // Password validation
            if (!this.registerForm.password) {
                errors.password = 'Password is required';
            } else if (this.registerForm.password.length < 8) {
                errors.password = 'Password must be at least 8 characters';
            } else if (!this.isStrongPassword(this.registerForm.password)) {
                errors.password = 'Password must contain uppercase, lowercase, number, and special character';
            }

            // Confirm password validation
            if (!this.registerForm.confirmPassword) {
                errors.confirmPassword = 'Please confirm your password';
            } else if (this.registerForm.password !== this.registerForm.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }

            // Terms validation
            if (!this.registerForm.acceptTerms) {
                errors.acceptTerms = 'You must accept the terms and conditions';
            }

            this.registerErrors = errors;
            return Object.keys(errors).length === 0;
        },

        // Utility functions
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        isStrongPassword(password) {
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            return hasUppercase && hasLowercase && hasNumbers && hasSpecial;
        },

        // Authentication actions
        async handleLogin(event) {
            event.preventDefault();

            if (!this.validateLoginForm()) {
                return;
            }

            this.isLoading = true;
            this.clearLoginErrors();

            try {
                const response = await fetch('http://127.0.0.1:8000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.loginForm.email,
                        password: this.loginForm.password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    this.handleLoginSuccess(data);
                } else {
                    this.loginErrors.general = data.detail || 'Login failed. Please try again.';
                }
            } catch (error) {
                this.loginErrors.general = 'Network error. Please check your connection and try again.';
            } finally {
                this.isLoading = false;
            }
        },

        async handleRegister(event) {
            event.preventDefault();

            if (!this.validateRegisterForm()) {
                return;
            }

            this.isLoading = true;
            this.clearRegisterErrors();

            try {
                const response = await fetch('http://127.0.0.1:8000/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.registerForm.email,
                        password: this.registerForm.password,
                        full_name: this.registerForm.full_name
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.email_confirmation_required) {
                        this.showEmailConfirmationMessage(data.message);
                        this.hideRegisterModal();
                    } else {
                        this.handleRegistrationSuccess(data);
                    }
                } else {
                    this.registerErrors.general = data.detail || 'Registration failed. Please try again.';
                }
            } catch (error) {
                this.registerErrors.general = 'Network error. Please check your connection and try again.';
            } finally {
                this.isLoading = false;
            }
        },

        // Success handlers
        handleLoginSuccess(data) {
            this.token = data.access_token;
            this.user = data.user;
            this.isAuthenticated = true;

            // Store in localStorage
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            // Setup auth headers
            this.setupAuthHeaders();

            // Hide modals
            this.hideLoginModal();
            this.$nextTick(() => {
                // Trigger a reactive update
                this.isAuthenticated = true;
              });

            // Show success message
            this.showSuccessMessage('Login successful! Welcome back.');

            // Refresh page data
            this.refreshUserData();
        },

        handleRegistrationSuccess(data) {
            this.token = data.access_token;
            this.user = data.user;
            this.isAuthenticated = true;

            // Store in localStorage
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            // Setup auth headers
            this.setupAuthHeaders();

            // Hide modals
            this.hideRegisterModal();

            // Show success message
            this.showSuccessMessage('Registration successful! Welcome to LayoutCraft.');

            // Refresh page data
            this.refreshUserData();
        },

        handleLogout() {
            this.isAuthenticated = false;
            this.user = null;
            this.token = null;

            // Clear localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');

            // Clear auth headers
            this.clearAuthHeaders();

            // Show message
            this.showSuccessMessage('Logged out successfully.');

            // Redirect to home or refresh page
            window.location.reload();
        },

        handleTokenExpiration() {
            this.showErrorMessage('Your session has expired. Please log in again.');
            this.handleLogout();
        },

        // API helpers
        setupAuthHeaders() {
            if (this.token) {
                // Set default headers for fetch requests
                window.authToken = this.token;
            }
        },

        clearAuthHeaders() {
            delete window.authToken;
        },

        async refreshUserData() {
            if (!this.token) return;

            try {
                const response = await fetch('http://127.0.0.1:8000/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    this.user = userData;
                    localStorage.setItem('user_data', JSON.stringify(userData));
                }
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        },

        // UI helpers
        showSuccessMessage(message) {
            this.showNotification(message, 'success');
        },

        showErrorMessage(message) {
            this.showNotification(message, 'error');
        },

        showEmailConfirmationMessage(message) {
            this.showNotification(message, 'info', 8000);
        },

        showNotification(message, type = 'info', duration = 3000) {
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
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, duration);
        },

        // Feature placeholders for future implementation
        showDashboard() {
            if (this.isAuthenticated) {
                window.dashboardManager.show('overview');
            } else {
                this.showLoginModal = true;
            }
          },

        showGenerationHistory() {
            console.log('Generation history feature coming soon!');
        },

        showAccountSettings() {
            console.log('Account settings feature coming soon!');
        },

        showUpgradePlan() {
            console.log('Upgrade plan feature coming soon!');
        },

        showForgotPasswordModal() {
            console.log('Forgot password feature coming soon!');
        },

        showDashboard() {
            if (this.isAuthenticated) {
                window.dashboardManager.show('overview');
            } else {
                this.showLoginModal = true;
            }
        },

        showGenerationHistory() {
            if (this.isAuthenticated) {
                window.dashboardManager.show('history');
            } else {
                this.showLoginModal = true;
            }
        },
        showUpgradePlan() {
            if (this.isAuthenticated) {
                window.subscriptionManager.init().then(() => {
                    window.dashboardManager.show('billing');
                });
            } else {
                this.showLoginModal = true;
            }
        },
        
        showPremiumFeatures() {
            if (this.isAuthenticated) {
                window.premiumFeatures.init().then(() => {
                    window.dashboardManager.show('premium');
                });
            } else {
                this.showLoginModal = true;
            }
          },

        showAccountSettings() {
            if (this.isAuthenticated) {
                window.dashboardManager.show('settings');
            } else {
                this.showLoginModal = true;
            }
        },
        // Add these methods to your existing Alpine.js auth store

        showUpgradePlan() {
            // Create and show pricing modal
            this.showPricingModal();
        },

        showPricingModal() {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            modal.innerHTML = `
      <div class="glass-card p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Upgrade Your Plan
          </h2>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div id="pricing-content">
          <div class="flex items-center justify-center h-32">
            <div class="loading-animation w-8 h-8"></div>
          </div>
        </div>
      </div>
    `;

            document.body.appendChild(modal);

            // Initialize and render pricing plans
            if (!window.pricingPlans) {
                window.pricingPlans = new PricingPlans();
            }

            window.pricingPlans.init().then(() => {
                const content = document.getElementById('pricing-content');
                if (content) {
                    content.innerHTML = window.pricingPlans.render();
                }
            });
        }
  
    });
});
  