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
            const errorData = await response.json().catch(() => ({}));
            const rawMessage = errorData.detail || `Error: ${response.status}`;
            // Use the new formatter to create a clean error message
            throw new Error(this.formatAuthError(rawMessage));
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return response.blob(); // For image generation
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