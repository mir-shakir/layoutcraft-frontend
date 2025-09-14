/*
=================================================================
 FILE 1: /shared/js/authService.js (FINAL, CORRECTED VERSION)
=================================================================
This is the single source of truth for all authentication logic.
It includes better error formatting inspired by your scripts.js.
*/

class AuthService {
    constructor() {
        // this.apiBaseUrl = 'https://layoutcraft-backend.onrender.com';
        this.apiBaseUrl = "http://127.0.0.1:8000"
        this.tokenKey = 'layoutcraft_access_token';
        this.userKey = 'layoutcraft_user';
    }

    // --- TOKEN & USER MANAGEMENT ---

    saveToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Add this new function inside the AuthService class in authService.js

    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        try {
            // Decode the token to get the expiration timestamp
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp;
            
            // Get the current time in seconds
            const now = Math.floor(Date.now() / 1000);

            // Return true if the token is expired, false otherwise
            return now >= expiry;
        } catch (e) {
            // If decoding fails, the token is invalid
            return true;
        }
    }
    saveUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    getCurrentUser() {
        const userStr = localStorage.getItem(this.userKey);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    hasToken() {
        return !!this.getToken();
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        // authchange event should be dispatched by the caller
        document.dispatchEvent(new CustomEvent('authChange'));
    }

    // --- API METHODS ---

    /**
     * Formats raw error messages into user-friendly text.
     * Inspired by the formatAuthError function in your scripts.js.
     * @param {string} message - The raw error message from the server.
     * @returns {string} A user-friendly error message.
     */
    formatAuthError(message) {
        if (message.includes('Invalid email or password') || message.includes('401')) {
            return 'Invalid email or password. Please check your credentials and try again.';
        }
        if (message.includes('Email already registered') || message.includes('already be registered')) {
            return 'An account with this email already exists. Try logging in instead.';
        }
        if (message.includes('Invalid email format')) {
            return 'Please enter a valid email address.';
        }
        if (message.includes('timeout') || message.includes('NetworkError')) {
            return 'Connection failed. Please check your internet and try again.';
        }
        return message || 'An unexpected error occurred. Please try again.';
    }

    async handleResponse(response) {
        if (!response.ok) {
            if (response.status === 401) {
                this.logout(); // Clears token from storage
                // Redirect to the homepage, which will then show the auth modal.
                window.location.href = '/?auth=required';
                // Throw a specific error that our app pages can look for.
                throw new Error('SESSION_EXPIRED');
            }
            const errorData = await response.json().catch(() => ({}));
            const rawMessage = errorData.detail || `Error: ${response.status}`;
            throw new Error(this.formatAuthError(rawMessage));
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return response.blob(); // For image generation
    }

    // ADD THIS NEW FUNCTION TO THE AuthService CLASS
    /**
     * Performs an authenticated fetch request.
     * Automatically adds the Authorization header and uses the centralized response handler.
     * @param {string} endpoint - The API endpoint to call (e.g., '/api/v1/generate').
     * @param {object} options - Standard fetch options (method, body, etc.).
     * @returns {Promise<any>} The parsed JSON response.
     */
    async fetchAuthenticated(endpoint, options = {}) {
        if(!this.hasToken() || this.isTokenExpired()) {
            this.logout(); // Clean up storage
            window.location.href = '/?auth=required'; // Redirect
            // Throw the specific error to stop the calling function (e.g., performAction)
            throw new Error('SESSION_EXPIRED');
        }
        const url = `${this.apiBaseUrl}${endpoint}`;
        const headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
        };

        const response = await fetch(url, { ...options, headers });
        return this.handleResponse(response);
    }

    async register(userData) {
        const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return this.handleResponse(response);
    }

    async login(credentials) {
        const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await this.handleResponse(response);
        if (data.access_token && data.user) {
            this.saveToken(data.access_token);
            this.saveUser(data.user);
        }
        return data;
    }
}

// Create and export a single, shared instance of the service.
const authService = new AuthService();
export { authService };