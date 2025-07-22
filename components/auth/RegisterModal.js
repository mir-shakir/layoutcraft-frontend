/**
 * Registration Modal Component for LayoutCraft
 * Handles user registration with validation and error handling
 */

class RegisterModal {
    constructor() {
        this.isVisible = false;
        this.isLoading = false;
        this.errors = {};
        this.formData = {
            email: '',
            password: '',
            confirmPassword: '',
            full_name: '',
            acceptTerms: false
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
            password: '',
            confirmPassword: '',
            full_name: '',
            acceptTerms: false
        };
    }

    clearErrors() {
        this.errors = {};
    }

    validateForm() {
        const errors = {};

        // Email validation
        if (!this.formData.email) {
            errors.email = 'Email is required';
        } else if (!this.isValidEmail(this.formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Full name validation
        if (!this.formData.full_name) {
            errors.full_name = 'Full name is required';
        } else if (this.formData.full_name.length < 2) {
            errors.full_name = 'Full name must be at least 2 characters';
        }

        // Password validation
        if (!this.formData.password) {
            errors.password = 'Password is required';
        } else if (this.formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!this.isStrongPassword(this.formData.password)) {
            errors.password = 'Password must contain uppercase, lowercase, number, and special character';
        }

        // Confirm password validation
        if (!this.formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (this.formData.password !== this.formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Terms validation
        if (!this.formData.acceptTerms) {
            errors.acceptTerms = 'You must accept the terms and conditions';
        }

        this.errors = errors;
        return Object.keys(errors).length === 0;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isStrongPassword(password) {
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return hasUppercase && hasLowercase && hasNumbers && hasSpecial;
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        this.isLoading = true;
        this.clearErrors();

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.formData.email,
                    password: this.formData.password,
                    full_name: this.formData.full_name
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.email_confirmation_required) {
                    // Show email confirmation message
                    this.showEmailConfirmationMessage(data.message);
                    this.hide();
                } else {
                    // Auto-login for confirmed users
                    localStorage.setItem('auth_token', data.access_token);
                    localStorage.setItem('user_data', JSON.stringify(data.user));

                    document.dispatchEvent(new CustomEvent('registrationSuccess', {
                        detail: { user: data.user, token: data.access_token }
                    }));

                    this.hide();
                    this.showSuccessMessage('Registration successful! Welcome to LayoutCraft.');
                }
            } else {
                this.errors.general = data.detail || 'Registration failed. Please try again.';
            }
        } catch (error) {
            this.errors.general = 'Network error. Please check your connection and try again.';
        } finally {
            this.isLoading = false;
        }
    }

    showEmailConfirmationMessage(message) {
        // Create and show email confirmation notification
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.innerHTML = `
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <div>
            <p class="font-medium">Check Your Email</p>
            <p class="text-sm">${message}</p>
          </div>
        </div>
      `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 8000); // Longer timeout for email confirmation
    }

    showSuccessMessage(message) {
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
        <div x-show="$store.auth.showRegisterModal" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          
          <div class="glass-card p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
               x-transition:enter="transition ease-out duration-300"
               x-transition:enter-start="opacity-0 transform scale-95"
               x-transition:enter-end="opacity-100 transform scale-100"
               x-transition:leave="transition ease-in duration-200"
               x-transition:leave-start="opacity-100 transform scale-100"
               x-transition:leave-end="opacity-0 transform scale-95">
            
            <!-- Close button -->
            <button @click="$store.auth.hideRegisterModal()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
  
            <!-- Header -->
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Create Account
              </h2>
              <p class="text-gray-600">Join LayoutCraft and start creating amazing visuals</p>
            </div>
  
            <!-- Registration Form -->
            <form @submit.prevent="$store.auth.handleRegister($event)">
              <!-- Full Name Field -->
              <div class="mb-4">
                <label for="register-name" class="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="register-name"
                  x-model="$store.auth.registerForm.full_name"
                  class="auth-input w-full p-3 rounded-lg"
                  placeholder="Enter your full name"
                  :class="{'border-red-500': $store.auth.registerErrors.full_name}"
                  required
                >
                <p x-show="$store.auth.registerErrors.full_name" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.registerErrors.full_name"></p>
              </div>
  
              <!-- Email Field -->
              <div class="mb-4">
                <label for="register-email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="register-email"
                  x-model="$store.auth.registerForm.email"
                  class="auth-input w-full p-3 rounded-lg"
                  placeholder="Enter your email"
                  :class="{'border-red-500': $store.auth.registerErrors.email}"
                  required
                >
                <p x-show="$store.auth.registerErrors.email" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.registerErrors.email"></p>
              </div>
  
              <!-- Password Field -->
              <div class="mb-4">
                <label for="register-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div class="relative">
                  <input
                    :type="$store.auth.showPassword ? 'text' : 'password'"
                    id="register-password"
                    x-model="$store.auth.registerForm.password"
                    class="auth-input w-full p-3 rounded-lg pr-10"
                    placeholder="Create a strong password"
                    :class="{'border-red-500': $store.auth.registerErrors.password}"
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
                <p x-show="$store.auth.registerErrors.password" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.registerErrors.password"></p>
                <p class="text-gray-500 text-xs mt-1">
                  Must contain uppercase, lowercase, number, and special character
                </p>
              </div>
  
              <!-- Confirm Password Field -->
              <div class="mb-4">
                <label for="register-confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  :type="$store.auth.showConfirmPassword ? 'text' : 'password'"
                  id="register-confirm-password"
                  x-model="$store.auth.registerForm.confirmPassword"
                  class="auth-input w-full p-3 rounded-lg"
                  placeholder="Confirm your password"
                  :class="{'border-red-500': $store.auth.registerErrors.confirmPassword}"
                  required
                >
                <p x-show="$store.auth.registerErrors.confirmPassword" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.registerErrors.confirmPassword"></p>
              </div>
  
              <!-- Terms Checkbox -->
              <div class="mb-6">
                <label class="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    x-model="$store.auth.registerForm.acceptTerms"
                    class="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    :class="{'border-red-500': $store.auth.registerErrors.acceptTerms}"
                    required
                  >
                  <span class="text-sm text-gray-600">
                    I agree to the 
                    <a href="#" class="text-indigo-600 hover:text-indigo-800">Terms of Service</a> 
                    and 
                    <a href="#" class="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
                  </span>
                </label>
                <p x-show="$store.auth.registerErrors.acceptTerms" 
                   class="text-red-500 text-sm mt-1"
                   x-text="$store.auth.registerErrors.acceptTerms"></p>
              </div>
  
              <!-- General Error -->
              <div x-show="$store.auth.registerErrors.general" 
                   class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-600 text-sm" x-text="$store.auth.registerErrors.general"></p>
              </div>
  
              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="$store.auth.isLoading"
                class="auth-submit-btn w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span x-show="!$store.auth.isLoading">Create Account</span>
                <span x-show="$store.auth.isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              </button>
            </form>
  
            <!-- Footer -->
            <div class="mt-6 text-center">
              <p class="text-gray-600">
                Already have an account?
                <button @click="$store.auth.showLoginModal(); $store.auth.hideRegisterModal()" 
                        class="text-indigo-600 hover:text-indigo-800 font-medium">
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      `;
    }
}
  