/**
 * Login Modal Component for LayoutCraft
 * Handles user login with validation and error handling
 */

class LoginModal {
    constructor() {
        this.isVisible = false;
        this.isLoading = false;
        this.errors = {};
        this.formData = {
            email: '',
            password: ''
        };
    }

    show() {
        this.isVisible = true;
        this.clearErrors();
        this.clearForm();
        document.body.classList.add('modal-open');
    }

    hide() {
        this.isVisible = false;
        this.clearErrors();
        document.body.classList.remove('modal-open');
    }

    clearForm() {
        this.formData = {
            email: '',
            password: ''
        };
    }

    clearErrors() {
        this.errors = {};
    }

    validateForm() {
        const errors = {};

        if (!this.formData.email) {
            errors.email = 'Email is required';
        } else if (!this.isValidEmail(this.formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!this.formData.password) {
            errors.password = 'Password is required';
        } else if (this.formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        this.errors = errors;
        return Object.keys(errors).length === 0;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        this.isLoading = true;
        this.clearErrors();

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.formData.email,
                    password: this.formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user_data', JSON.stringify(data.user));

                // Trigger login success event
                document.dispatchEvent(new CustomEvent('loginSuccess', {
                    detail: { user: data.user, token: data.access_token }
                }));

                this.hide();
                this.showSuccessMessage('Login successful!');
            } else {
                this.errors.general = data.detail || 'Login failed. Please try again.';
            }
        } catch (error) {
            this.errors.general = 'Network error. Please check your connection and try again.';
        } finally {
            this.isLoading = false;
        }
    }

    showSuccessMessage(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
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
        <div x-show="$store.auth.showLoginModal" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          
          <div class="glass-card p-8 max-w-md w-full relative"
               x-transition:enter="transition ease-out duration-300"
               x-transition:enter-start="opacity-0 transform scale-95"
               x-transition:enter-end="opacity-100 transform scale-100"
               x-transition:leave="transition ease-in duration-200"
               x-transition:leave-start="opacity-100 transform scale-100"
               x-transition:leave-end="opacity-0 transform scale-95">
            
            <!-- Close button -->
            <button @click="$store.auth.hideLoginModal()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
  
            <!-- Header -->
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h2>
              <p class="text-gray-600">Sign in to your LayoutCraft account</p>
            </div>
  
            <!-- Login Form -->
            <form @submit.prevent="$store.auth.handleLogin($event)">
              <!-- Email Field -->
              <div class="mb-4">
                <label for="login-email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  x-model="$store.auth.loginForm.email"
                  class="auth-input w-full p-3 rounded-lg"
                  placeholder="Enter your email"
                  :class="{'border-red-500': $store.auth.loginErrors.email}"
                  required
                >
                <p x-show="$store.auth.loginErrors.email" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.loginErrors.email"></p>
              </div>
  
              <!-- Password Field -->
              <div class="mb-6">
                <label for="login-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div class="relative">
                  <input
                    :type="$store.auth.showPassword ? 'text' : 'password'"
                    id="login-password"
                    x-model="$store.auth.loginForm.password"
                    class="auth-input w-full p-3 rounded-lg pr-10"
                    placeholder="Enter your password"
                    :class="{'border-red-500': $store.auth.loginErrors.password}"
                    required
                  >
                  <button type="button" 
                          @click="$store.auth.showPassword = !$store.auth.showPassword"
                          class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <svg x-show="!$store.auth.showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg x-show="$store.auth.showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    </svg>
                  </button>
                </div>
                <p x-show="$store.auth.loginErrors.password" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.loginErrors.password"></p>
              </div>
  
              <!-- General Error -->
              <div x-show="$store.auth.loginErrors.general" 
                   class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-600 text-sm" x-text="$store.auth.loginErrors.general"></p>
              </div>
  
              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="$store.auth.isLoading"
                class="auth-submit-btn w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span x-show="!$store.auth.isLoading">Sign In</span>
                <span x-show="$store.auth.isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              </button>
            </form>
  
            <!-- Footer -->
            <div class="mt-6 text-center">
              <p class="text-gray-600">
                Don't have an account?
                <button @click="$store.auth.showRegisterModal(); $store.auth.hideLoginModal()" 
                        class="text-indigo-600 hover:text-indigo-800 font-medium">
                  Sign up
                </button>
              </p>
              <button @click="$store.auth.showForgotPasswordModal()" 
                      class="text-sm text-gray-500 hover:text-gray-700 mt-2">
                Forgot your password?
              </button>
            </div>
          </div>
        </div>
      `;
    }
}
  